-- Multi-idioma en tags. `name` sigue siendo la clave canónica (minúsculas, unique,
-- en el idioma de quien lo creó); `name_i18n` guarda las variantes por idioma.
-- La deduplicación del catálogo es solo por `name` canónico (no se fusionan
-- sinónimos entre idiomas: aceptable).

alter table public.tags
  add column name_i18n  jsonb,
  add column translated boolean not null default false;

-- tags ya tiene `grant select on public.tags to authenticated` (todas las columnas).
