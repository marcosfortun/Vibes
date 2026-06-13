-- Proveedores de información externa por categoría. Se usan como fuentes de la
-- búsqueda externa al crear una recomendación (paso 1 del alta).
--
-- `kind` mapea a un adaptador en código (tmdb, steam, ai). La búsqueda recorre los
-- proveedores de la categoría por `position` ascendente y usa el primero que
-- devuelva resultados; si todos fallan, la app sigue normal sin resultados externos.

create table public.providers (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.category_providers (
  category_id uuid not null references public.categories (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  position    int  not null,
  primary key (category_id, provider_id),
  unique (category_id, position)
);

create index idx_category_providers_category
  on public.category_providers (category_id, position);

-- RLS: lectura para authenticated (lo consulta la búsqueda del paso 1). Escritura
-- sin política de cliente (semilla / futura UI de admin con privilegios elevados).
alter table public.providers          enable row level security;
alter table public.category_providers enable row level security;

revoke all on public.providers          from anon;
revoke all on public.category_providers from anon;
grant select on public.providers          to authenticated;
grant select on public.category_providers to authenticated;

create policy providers_select on public.providers
  for select to authenticated using (true);
create policy category_providers_select on public.category_providers
  for select to authenticated using (true);

-- Catálogo inicial de proveedores (estable, independiente de los datos).
insert into public.providers (kind, name) values
  ('tmdb',  'TMDB'),
  ('steam', 'Steam'),
  ('ai',    'IA')
on conflict (kind) do nothing;
