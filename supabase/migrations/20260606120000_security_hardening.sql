-- Vibes — Endurecimiento de seguridad (auditoría caja blanca, release 1.1.0).
-- Migración forward-only: no reescribe migraciones ya aplicadas.

-- ─────────────────────────────────────────────────────────────────────────
-- F1 — IDOR en organizar_quedada.
-- El RPC es SECURITY DEFINER (salta RLS) y aceptaba cualquier array de UUIDs,
-- permitiendo enumerar los items 'saved' (Mi Lista privada) de usuarios
-- arbitrarios. Se exige que el llamante se incluya como asistente y que el
-- resto de asistentes sean amigos suyos (coincide con el flujo real de la UI:
-- attendees = [selfId, ...amigosSeleccionados]).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.organizar_quedada(attendees uuid[])
returns table (recommendation_id uuid, title text, category_id uuid, sg numeric)
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

  -- El llamante debe formar parte de la quedada.
  if not (v_caller = any (attendees)) then
    raise exception 'debes incluirte como asistente';
  end if;

  -- Todo asistente distinto del llamante debe ser amigo saliente del llamante.
  if exists (
    select 1
    from unnest(attendees) as a(id)
    where a.id <> v_caller
      and not exists (
        select 1 from public.friendships f
        where f.user_id = v_caller and f.friend_id = a.id
      )
  ) then
    raise exception 'solo puedes organizar quedadas con tus amigos';
  end if;

  return query
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
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- F2 — is_admin(uuid) ejecutable por anon/public.
-- Permitía a cualquiera (incluso sin autenticar) sondear el rol admin de un
-- UUID. Las políticas RLS de categories lo invocan como 'authenticated', así
-- que basta con conservar ese grant.
-- ─────────────────────────────────────────────────────────────────────────
revoke execute on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- F3 — Funciones trigger SECURITY DEFINER expuestas vía RPC.
-- Postgres bloquea la invocación directa de funciones que devuelven 'trigger',
-- pero por defensa en profundidad e higiene del linter se revoca EXECUTE.
-- (Los triggers siguen ejecutándose: se evalúan con el rol propietario, no
-- requieren el privilegio EXECUTE del invocador.)
-- ─────────────────────────────────────────────────────────────────────────
revoke execute on function public.handle_new_user()      from public, anon, authenticated;
revoke execute on function public.maintain_affinity()    from public, anon, authenticated;
revoke execute on function public.maintain_global_score() from public, anon, authenticated;
revoke execute on function public.set_updated_at()       from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- F4 — set_updated_at con search_path mutable.
-- ─────────────────────────────────────────────────────────────────────────
alter function public.set_updated_at() set search_path = public;
