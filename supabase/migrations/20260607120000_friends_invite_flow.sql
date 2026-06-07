-- Vibes — Release 1.2.0: amistad por enlace de invitación.
-- El enlace es personal y reutilizable, caduca a las 48h y es revocable/regenerable.
-- La amistad deja de crearse en el alta: ahora hay un paso explícito de aceptación
-- (accept_invitation), que vale tanto para usuarios nuevos como ya existentes.

-- ─────────────────────────────────────────────────────────────────────────
-- 1) invitation_tokens: tokens reutilizables y revocables.
--    "activo" = revoked_at is null and expires_at > now(). 'is_used' queda en
--    desuso (se conserva la columna por compatibilidad).
-- ─────────────────────────────────────────────────────────────────────────
alter table public.invitation_tokens
  add column if not exists revoked_at timestamptz;

create index if not exists idx_invitation_tokens_generated_by_active
  on public.invitation_tokens (generated_by)
  where revoked_at is null;

-- ─────────────────────────────────────────────────────────────────────────
-- 2) invite_token_valid: validez basada en revocación/caducidad (sin is_used).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.invite_token_valid(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.invitation_tokens
    where token = t and revoked_at is null and expires_at > now()
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3) ensure_invite: token activo del llamante; si no hay, crea uno (48h).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.ensure_invite()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_token  uuid;
begin
  if v_caller is null then
    raise exception 'no autenticado';
  end if;

  select token into v_token
  from public.invitation_tokens
  where generated_by = v_caller and revoked_at is null and expires_at > now()
  order by created_at desc
  limit 1;

  if v_token is not null then
    return v_token;
  end if;

  insert into public.invitation_tokens (generated_by, expires_at)
  values (v_caller, now() + interval '48 hours')
  returning token into v_token;

  return v_token;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4) regenerate_invite: revoca los activos y crea uno nuevo (48h).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.regenerate_invite()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_token  uuid;
begin
  if v_caller is null then
    raise exception 'no autenticado';
  end if;

  update public.invitation_tokens
  set revoked_at = now()
  where generated_by = v_caller and revoked_at is null;

  insert into public.invitation_tokens (generated_by, expires_at)
  values (v_caller, now() + interval '48 hours')
  returning token into v_token;

  return v_token;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 5) revoke_invite: revoca los activos del llamante (sin crear otro).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.revoke_invite()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'no autenticado';
  end if;

  update public.invitation_tokens
  set revoked_at = now()
  where generated_by = v_caller and revoked_at is null;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 6) invite_info: datos mínimos del anfitrión para la landing del enlace.
--    Devuelve 0 filas si el token no es válido (no expone email).
--    Accesible por anon para mostrar "@host te ha invitado" antes del login.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.invite_info(t uuid)
returns table (host_id uuid, host_username text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.username
  from public.invitation_tokens it
  join public.users u on u.id = it.generated_by
  where it.token = t and it.revoked_at is null and it.expires_at > now();
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 7) accept_invitation: crea la amistad bidireccional desde un token activo.
--    No consume el token (reutilizable). Devuelve el anfitrión y si la
--    amistad era nueva (created), para que el servidor decida si notifica.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.accept_invitation(t uuid)
returns table (host_id uuid, created boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_host   uuid;
  v_rows   integer := 0;
begin
  if v_caller is null then
    raise exception 'no autenticado';
  end if;

  select generated_by into v_host
  from public.invitation_tokens
  where token = t and revoked_at is null and expires_at > now();

  if v_host is null then
    raise exception 'invitación inválida, revocada o caducada';
  end if;

  if v_host = v_caller then
    raise exception 'no puedes aceptar tu propia invitación';
  end if;

  insert into public.friendships (user_id, friend_id) values
    (v_caller, v_host),
    (v_host, v_caller)
  on conflict do nothing;

  get diagnostics v_rows = row_count;

  return query select v_host, (v_rows > 0);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 8) handle_new_user: el alta ya NO crea amistad ni consume el token.
--    Mantiene el gate de invitación (token activo obligatorio, SIN excepciones;
--    se conserva la retirada del admin-semilla de 20260606130000). La amistad
--    pasa a crearse en accept_invitation y el token es reutilizable.
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
  v_language text := lower(coalesce(new.raw_user_meta_data ->> 'language', ''));
  v_host     uuid;
begin
  if v_username is null or length(trim(v_username)) = 0 then
    raise exception 'username es obligatorio en el alta';
  end if;

  if v_language not in ('en', 'es', 'fr', 'pt') then
    v_language := 'en';
  end if;

  if v_token is null then
    raise exception 'invite_token es obligatorio';
  end if;

  select generated_by into v_host
  from public.invitation_tokens
  where token = v_token and revoked_at is null and expires_at > now();

  if v_host is null then
    raise exception 'invite_token inválido, revocado o caducado';
  end if;

  insert into public.users (id, email, username, role, language)
  values (new.id, new.email, v_username, 'user', v_language::public.app_language);

  -- La amistad se crea después, en accept_invitation (flujo uniforme para
  -- usuarios nuevos y existentes). El token NO se consume (es reutilizable).
  return new;
end;
$$;

-- Mantener EXECUTE revocado tras el replace (defensa en profundidad).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 9) Retirar add_friend: añadir amigos por búsqueda deja de existir.
--    La única vía es accept_invitation (enlace de invitación).
-- ─────────────────────────────────────────────────────────────────────────
revoke execute on function public.add_friend(uuid) from public, anon, authenticated;
drop function if exists public.add_friend(uuid);

-- ─────────────────────────────────────────────────────────────────────────
-- 10) RLS users: sin descubrimiento por is_searchable. Solo fila propia o amigos.
--     Se retira el grant de update sobre is_searchable (Ajustes ya no lo toca).
-- ─────────────────────────────────────────────────────────────────────────
revoke update (is_searchable) on public.users from authenticated;

drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.friendships f
      where f.user_id = auth.uid() and f.friend_id = users.id
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- 11) Permisos de ejecución de los nuevos RPCs.
-- ─────────────────────────────────────────────────────────────────────────
revoke execute on function public.ensure_invite()         from public, anon;
revoke execute on function public.regenerate_invite()     from public, anon;
revoke execute on function public.revoke_invite()         from public, anon;
revoke execute on function public.accept_invitation(uuid) from public, anon;

grant execute on function public.ensure_invite()          to authenticated;
grant execute on function public.regenerate_invite()      to authenticated;
grant execute on function public.revoke_invite()          to authenticated;
grant execute on function public.accept_invitation(uuid)  to authenticated;

revoke execute on function public.invite_info(uuid) from public;
grant execute on function public.invite_info(uuid) to anon, authenticated;
