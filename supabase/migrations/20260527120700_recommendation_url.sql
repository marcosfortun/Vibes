-- URL opcional en recomendaciones (el título enlaza a ella).
alter table public.recommendations
  add column url text check (url is null or url ~ '^https?://');

-- Exponer/insertar la columna a clientes authenticated (created_by sigue oculto).
grant select (url) on public.recommendations to authenticated;
grant insert (url) on public.recommendations to authenticated;
