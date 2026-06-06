-- Desacopla "guardado" de "calificado": status (enum) → saved (boolean) + rating (nullable).
-- Permite tener simultáneamente una rec en Mi Lista y con calificación.

-- 1) saved boolean migrado desde status
alter table public.user_interactions add column saved boolean not null default false;
update public.user_interactions set saved = (status = 'saved');

-- 2) Quitar el check que ligaba status+rating y la policy que referenciaba status
alter table public.user_interactions drop constraint if exists rating_matches_status;
drop policy if exists user_interactions_select on public.user_interactions;

-- 3) Quitar la columna status (los grants por columna sobre status se eliminan en cascada)
alter table public.user_interactions drop column status;

-- 4) Constraints nuevos:
--    - cada fila debe representar algo (saved o rating)
--    - rating válido si presente
alter table public.user_interactions
  add constraint interaction_present check (saved or rating is not null),
  add constraint rating_valid check (rating is null or rating in (-1, 1, 2));

-- 5) Índice de consulta principal (user_id, saved, recommendation_id)
drop index if exists idx_user_interactions_user_status_rec;
create index idx_user_interactions_user_saved_rec
  on public.user_interactions (user_id, saved, recommendation_id);

-- 6) Trigger maintain_global_score: usa rating en lugar de status='completed'
create or replace function public.maintain_global_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_contrib integer := 0;
  new_contrib integer := 0;
begin
  if (tg_op = 'UPDATE' or tg_op = 'DELETE') and old.rating is not null then
    old_contrib := old.rating;
  end if;
  if (tg_op = 'UPDATE' or tg_op = 'INSERT') and new.rating is not null then
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

-- 7) Trigger maintain_affinity: usa rating, no status
create or replace function public.maintain_affinity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor  uuid;
  v_item   uuid;
  v_old_r  integer;
  v_new_r  integer;
  r        record;
  d_old    numeric;
  d_new    numeric;
  adjust   numeric;
begin
  if tg_op = 'DELETE' then
    v_actor := old.user_id;
    v_item  := old.recommendation_id;
  else
    v_actor := new.user_id;
    v_item  := new.recommendation_id;
  end if;

  v_old_r := case when tg_op in ('UPDATE','DELETE') and old.rating is not null then old.rating end;
  v_new_r := case when tg_op in ('UPDATE','INSERT') and new.rating is not null then new.rating end;

  if v_old_r is null and v_new_r is null then
    return coalesce(new, old);
  end if;

  for r in
    select f.friend_id, ui.rating as friend_rating
    from public.friendships f
    join public.user_interactions ui
      on ui.user_id = f.friend_id
     and ui.recommendation_id = v_item
     and ui.rating is not null
    where f.user_id = v_actor
  loop
    d_old := case when v_old_r is null then 0 else (abs(v_old_r - r.friend_rating) - 1) * -1 end;
    d_new := case when v_new_r is null then 0 else (abs(v_new_r - r.friend_rating) - 1) * -1 end;
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

-- 8) RLS select policy: friends ven items con rating no nulo (antes: status='completed')
drop policy if exists user_interactions_select on public.user_interactions;
create policy user_interactions_select on public.user_interactions
  for select to authenticated
  using (
    user_id = auth.uid()
    or (
      rating is not null
      and exists (
        select 1 from public.friendships f
        where f.user_id = auth.uid() and f.friend_id = user_interactions.user_id
      )
    )
  );

-- 9) Grants por columna actualizados (status ya no existe; añadir saved)
grant insert (saved) on public.user_interactions to authenticated;
grant update (saved) on public.user_interactions to authenticated;

-- 10) RPC organizar_quedada: usar saved=true y rating is not null
create or replace function public.organizar_quedada(attendees uuid[])
returns table (recommendation_id uuid, title text, category_id uuid, sg numeric)
language sql
security definer
set search_path = public
as $$
  with n as (
    select greatest(coalesce(array_length(attendees, 1), 0), 1) as cnt
  ),
  candidates as (
    select distinct s.recommendation_id as rid
    from public.user_interactions s
    where s.user_id = any (attendees)
      and s.saved = true
      and not exists (
        select 1 from public.user_interactions c
        where c.recommendation_id = s.recommendation_id
          and c.user_id = any (attendees)
          and c.rating is not null
      )
  ),
  scored as (
    select cnd.rid,
           coalesce(sum(uo.rating * f.affinity / 5.0), 0) as total
    from candidates cnd
    cross join unnest(attendees) as att(uid)
    left join public.friendships f
      on f.user_id = att.uid
    left join public.user_interactions uo
      on uo.user_id = f.friend_id
     and uo.recommendation_id = cnd.rid
     and uo.rating is not null
    group by cnd.rid
  )
  select sc.rid, r.title, r.category_id,
         (sc.total / (select cnt from n))::numeric as sg
  from scored sc
  join public.recommendations r on r.id = sc.rid
  order by sg desc
  limit 3;
$$;

-- 11) (Opcional) eliminar el enum interaction_status que ya no se usa
drop type if exists public.interaction_status;
