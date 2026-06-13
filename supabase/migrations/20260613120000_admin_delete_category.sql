-- Borrado de categoría con migración de recomendaciones (panel de admin).
--
-- Motivo: recommendations.category_id es NOT NULL y `authenticated` NO tiene
-- GRANT UPDATE sobre recommendations (catálogo append-only), así que el admin
-- no puede reasignar recomendaciones ajenas desde el cliente y el DELETE de la
-- categoría falla por la FK. Este RPC SECURITY DEFINER hace la operación atómica:
-- valida admin, migra las recomendaciones a otra categoría y borra la original.
create or replace function public.admin_delete_category(
  p_category   uuid,
  p_migrate_to uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'solo admin puede eliminar categorías';
  end if;

  if p_migrate_to is not null and p_migrate_to <> p_category then
    update public.recommendations
    set category_id = p_migrate_to
    where category_id = p_category;
  end if;

  delete from public.categories where id = p_category;
end;
$$;

revoke execute on function public.admin_delete_category(uuid, uuid) from public, anon;
grant execute on function public.admin_delete_category(uuid, uuid) to authenticated;
