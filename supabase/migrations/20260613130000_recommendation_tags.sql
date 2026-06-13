-- Tags de recomendaciones: texto libre, compartidos, con autocompletado por uso.
-- Modelo normalizado (catálogo `tags` + join `recommendation_tags`) para poder
-- ordenar las sugerencias por frecuencia de uso y deduplicar nombres.

create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table public.recommendation_tags (
  recommendation_id uuid not null references public.recommendations (id) on delete cascade,
  tag_id            uuid not null references public.tags (id) on delete cascade,
  primary key (recommendation_id, tag_id)
);

create index idx_recommendation_tags_tag on public.recommendation_tags (tag_id);
create index idx_recommendation_tags_rec on public.recommendation_tags (recommendation_id);
create index idx_tags_name_trgm on public.tags using gin (name extensions.gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────────────────
-- RLS: catálogo de lectura global; escritura solo vía RPC SECURITY DEFINER.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.tags                enable row level security;
alter table public.recommendation_tags enable row level security;

revoke all on public.tags                from anon;
revoke all on public.recommendation_tags from anon;
grant select on public.tags                to authenticated;
grant select on public.recommendation_tags to authenticated;

create policy tags_select on public.tags
  for select to authenticated using (true);
create policy recommendation_tags_select on public.recommendation_tags
  for select to authenticated using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- suggest_tags: autocompletado por prefijo, ordenado por uso (desc) y nombre.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.suggest_tags(p_query text default '', p_limit int default 8)
returns table (name text, uses bigint)
language sql
stable
security definer
set search_path = public
as $$
  select t.name, count(rt.tag_id) as uses
  from public.tags t
  left join public.recommendation_tags rt on rt.tag_id = t.id
  where coalesce(trim(p_query), '') = ''
     or t.name like lower(trim(p_query)) || '%'
  group by t.id, t.name
  order by uses desc, t.name asc
  limit greatest(1, least(coalesce(p_limit, 8), 20));
$$;

revoke execute on function public.suggest_tags(text, int) from public, anon;
grant execute on function public.suggest_tags(text, int) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- create_recommendation: alta del catálogo + enlazado de hasta 5 tags, atómico.
-- Reemplaza el INSERT directo del cliente para poder crear/enlazar tags
-- (recommendations es append-only y el cliente no escribe en tags).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.create_recommendation(
  p_title       text,
  p_description text default null,
  p_url         text default null,
  p_category    uuid default null,
  p_tags        text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_rec  uuid;
  v_name text;
  v_tag  uuid;
begin
  if v_uid is null then
    raise exception 'no autenticado';
  end if;
  if p_title is null or length(trim(p_title)) = 0 then
    raise exception 'título obligatorio';
  end if;
  if p_category is null then
    raise exception 'categoría obligatoria';
  end if;

  insert into public.recommendations (title, description, url, category_id, created_by)
  values (
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_url, '')), ''),
    p_category,
    v_uid
  )
  returning id into v_rec;

  -- Normaliza (minúsculas + trim), deduplica preservando el orden de entrada y
  -- limita a 5. Crea el tag si no existe y lo enlaza.
  for v_name in
    select name from (
      select lower(trim(t)) as name, min(ord) as ord
      from unnest(coalesce(p_tags, '{}')) with ordinality as u(t, ord)
      where length(trim(t)) > 0
      group by lower(trim(t))
    ) s
    order by s.ord
    limit 5
  loop
    insert into public.tags (name) values (v_name)
      on conflict (name) do update set name = excluded.name
      returning id into v_tag;
    insert into public.recommendation_tags (recommendation_id, tag_id)
      values (v_rec, v_tag)
      on conflict do nothing;
  end loop;

  return v_rec;
end;
$$;

revoke execute on function public.create_recommendation(text, text, text, uuid, text[]) from public, anon;
grant execute on function public.create_recommendation(text, text, text, uuid, text[]) to authenticated;
