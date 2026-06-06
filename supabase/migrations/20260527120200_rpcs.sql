-- Vibes — RPCs SECURITY DEFINER (operaciones que cruzan fronteras de privacidad).

-- ─────────────────────────────────────────────────────────────────────────
-- add_friend: amistad manual desde el buscador. Bidireccional, afinidad 5.0.
-- Solo sobre usuarios visibles (is_searchable) o ya relacionados.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.add_friend(target_id uuid)
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
  if target_id = v_caller then
    raise exception 'no puedes añadirte a ti mismo';
  end if;
  if not exists (
    select 1 from public.users u
    where u.id = target_id
      and (u.is_searchable
           or exists (select 1 from public.friendships f
                      where f.user_id = v_caller and f.friend_id = target_id))
  ) then
    raise exception 'usuario no encontrado o no visible';
  end if;

  insert into public.friendships (user_id, friend_id) values
    (v_caller, target_id),
    (target_id, v_caller)
  on conflict do nothing;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- remove_friend: elimina ambas direcciones para mantener coherencia de feeds.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.remove_friend(target_id uuid)
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
  delete from public.friendships
  where (user_id = v_caller and friend_id = target_id)
     or (user_id = target_id and friend_id = v_caller);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- organizar_quedada: consenso grupal.
-- 1) candidatos = 'saved' por al menos un asistente.
-- 2) excluye lo 'completed' por cualquier asistente.
-- 3) SG = media del Scoring Personalizado de cada asistente.
--    Scoring Personalizado_i(item) = Σ_amigos(rating_amigo * afinidad_i→amigo / 5)
-- 4) Top 3 por SG desc.
-- ─────────────────────────────────────────────────────────────────────────
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
      and s.status = 'saved'
      and not exists (
        select 1 from public.user_interactions c
        where c.recommendation_id = s.recommendation_id
          and c.user_id = any (attendees)
          and c.status = 'completed'
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
     and uo.status = 'completed'
    group by cnd.rid
  )
  select sc.rid, r.title, r.category_id,
         (sc.total / (select cnt from n))::numeric as sg
  from scored sc
  join public.recommendations r on r.id = sc.rid
  order by sg desc
  limit 3;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- find_similar_recommendations: deduplicación difusa en tiempo de escritura.
-- Mantiene el uso de pg_trgm encapsulado en el servidor.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.find_similar_recommendations(
  q text,
  threshold real default 0.3
)
returns table (id uuid, title text, category_id uuid, similarity real)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select r.id, r.title, r.category_id, similarity(r.title, q) as similarity
  from public.recommendations r
  where r.title % q
    and similarity(r.title, q) >= threshold
  order by similarity desc
  limit 5;
$$;
