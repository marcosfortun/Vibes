-- Vibes — Funciones y triggers.

-- ─────────────────────────────────────────────────────────────────────────
-- Helper: ¿el usuario es admin? SECURITY DEFINER para evitar recursión RLS.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u where u.id = uid and u.role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at automático.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_user_interactions_updated_at
  before update on public.user_interactions
  for each row execute function public.set_updated_at();

create trigger trg_friendships_updated_at
  before update on public.friendships
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Alta invite-only: trigger AFTER INSERT en auth.users.
-- Lee invite_token y username de raw_user_meta_data. El admin semilla
-- (admin@example.com) se da de alta como admin sin requerir token.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := new.raw_user_meta_data ->> 'username';
  v_token    uuid := nullif(new.raw_user_meta_data ->> 'invite_token', '')::uuid;
  v_host     uuid;
begin
  if v_username is null or length(trim(v_username)) = 0 then
    raise exception 'username es obligatorio en el alta';
  end if;

  -- Admin semilla: bypass de token.
  if new.email = 'admin@example.com' then
    insert into public.users (id, email, username, role)
    values (new.id, new.email, v_username, 'admin');
    return new;
  end if;

  -- Resto de usuarios: token válido obligatorio.
  if v_token is null then
    raise exception 'invite_token es obligatorio';
  end if;

  select generated_by into v_host
  from public.invitation_tokens
  where token = v_token and is_used = false and expires_at > now()
  for update;

  if v_host is null then
    raise exception 'invite_token inválido, usado o expirado';
  end if;

  insert into public.users (id, email, username, role)
  values (new.id, new.email, v_username, 'user');

  update public.invitation_tokens
  set is_used = true
  where token = v_token;

  -- Amistad bidireccional con el anfitrión, afinidad inicial 5.0.
  insert into public.friendships (user_id, friend_id) values
    (new.id, v_host),
    (v_host, new.id)
  on conflict do nothing;

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- Caché de global_score: suma de ratings de interacciones 'completed'.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.maintain_global_score()
returns trigger
language plpgsql
as $$
declare
  old_contrib integer := 0;
  new_contrib integer := 0;
begin
  if (tg_op = 'UPDATE' or tg_op = 'DELETE')
     and old.status = 'completed' then
    old_contrib := old.rating;
  end if;
  if (tg_op = 'UPDATE' or tg_op = 'INSERT')
     and new.status = 'completed' then
    new_contrib := new.rating;
  end if;

  if tg_op = 'DELETE' then
    update public.recommendations
    set global_score = global_score - old_contrib
    where id = old.recommendation_id;
    return old;
  else
    update public.recommendations
    set global_score = global_score + (new_contrib - old_contrib)
    where id = new.recommendation_id;
    return new;
  end if;
end;
$$;

create trigger trg_maintain_global_score
  after insert or update or delete on public.user_interactions
  for each row execute function public.maintain_global_score();

-- ─────────────────────────────────────────────────────────────────────────
-- Afinidad asimétrica dinámica con control de deriva.
-- Δ = (abs(rating_mío - rating_amigo) - 1) * (-1)
-- Cuando A actúa, se ajusta SOLO la fila friendships (user_id=A, friend_id=B)
-- por cada amigo B con rating 'completed' en el mismo ítem.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.maintain_affinity()
returns trigger
language plpgsql
as $$
declare
  v_actor   uuid;
  v_item    uuid;
  v_old_r   integer;  -- rating previo del actor (null si no aplicaba)
  v_new_r   integer;  -- rating nuevo del actor (null si no aplica)
  r         record;
  d_old     numeric;
  d_new     numeric;
  adjust    numeric;
begin
  if tg_op = 'DELETE' then
    v_actor := old.user_id;
    v_item  := old.recommendation_id;
  else
    v_actor := new.user_id;
    v_item  := new.recommendation_id;
  end if;

  v_old_r := case when tg_op in ('UPDATE','DELETE') and old.status = 'completed'
                  then old.rating end;
  v_new_r := case when tg_op in ('UPDATE','INSERT') and new.status = 'completed'
                  then new.rating end;

  -- Nada que ajustar si el actor no tiene ni tenía rating.
  if v_old_r is null and v_new_r is null then
    return coalesce(new, old);
  end if;

  -- Por cada amigo B (fila saliente del actor) que tenga rating completed en el ítem.
  for r in
    select f.friend_id, ui.rating as friend_rating
    from public.friendships f
    join public.user_interactions ui
      on ui.user_id = f.friend_id
     and ui.recommendation_id = v_item
     and ui.status = 'completed'
    where f.user_id = v_actor
  loop
    d_old := case when v_old_r is null then 0
                  else (abs(v_old_r - r.friend_rating) - 1) * -1 end;
    d_new := case when v_new_r is null then 0
                  else (abs(v_new_r - r.friend_rating) - 1) * -1 end;
    adjust := d_new - d_old;

    if adjust <> 0 then
      update public.friendships
      set affinity = greatest(0, least(10, affinity + adjust))
      where user_id = v_actor and friend_id = r.friend_id;
    end if;
  end loop;

  return coalesce(new, old);
end;
$$;

create trigger trg_maintain_affinity
  after insert or update or delete on public.user_interactions
  for each row execute function public.maintain_affinity();
