-- Multi-idioma automático (no gestionable por el usuario) en recomendaciones y
-- categorías. El texto se traduce al crear (Claude Haiku, server-side). Si la
-- traducción no está disponible, `translated=false` y el render cae al texto origen.
--
-- Modelo: columnas JSONB `*_i18n` = {"en":..,"es":..,"fr":..,"pt":..} junto a la
-- columna origen, que se conserva como fuente/fallback.

alter table public.recommendations
  add column title_i18n       jsonb,
  add column description_i18n jsonb,
  add column translated       boolean not null default false;

alter table public.categories
  add column name_i18n  jsonb,
  add column translated boolean not null default false;

-- recommendations tiene grants por columna (catálogo neutro). Exponer las nuevas
-- columnas de lectura a authenticated (el INSERT sigue yendo por RPC SECURITY DEFINER).
grant select (title_i18n, description_i18n, translated)
  on public.recommendations to authenticated;

-- categories ya tiene grant a nivel de tabla (select/insert/update/delete), así que
-- las nuevas columnas quedan cubiertas automáticamente.
