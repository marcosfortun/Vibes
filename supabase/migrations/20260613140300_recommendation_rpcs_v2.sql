-- RPCs v2 para el alta multi-idioma y la búsqueda del alta en 2 pasos.

-- ─────────────────────────────────────────────────────────────────────────
-- create_recommendation v2: alta con textos i18n y tags (cada tag con su i18n).
-- Reemplaza la firma anterior (text,text,text,uuid,text[]).
-- ─────────────────────────────────────────────────────────────────────────
drop function if exists public.create_recommendation(text, text, text, uuid, text[]);

create or replace function public.create_recommendation(
  p_title            text,
  p_title_i18n       jsonb,
  p_description      text,
  p_description_i18n jsonb,
  p_url              text,
  p_category         uuid,
  p_translated       boolean,
  p_tags             jsonb default '[]'::jsonb  -- [{name, name_i18n, translated}]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_rec   uuid;
  v_name  text;
  v_i18n  jsonb;
  v_tr    boolean;
  v_tag   uuid;
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

  insert into public.recommendations
    (title, title_i18n, description, description_i18n, url, category_id, created_by, translated)
  values (
    trim(p_title),
    p_title_i18n,
    nullif(trim(coalesce(p_description, '')), ''),
    p_description_i18n,
    nullif(trim(coalesce(p_url, '')), ''),
    p_category,
    v_uid,
    coalesce(p_translated, false)
  )
  returning id into v_rec;

  -- Tags: normaliza el nombre canónico, deduplica por él preservando el orden de
  -- entrada y limita a 5. Conserva el i18n existente si el tag ya existía.
  for v_name, v_i18n, v_tr in
    select nm,
           (array_agg(i18n order by ord))[1],
           (array_agg(tr   order by ord))[1]
    from (
      select lower(trim(e->>'name')) as nm,
             e->'name_i18n'          as i18n,
             coalesce((e->>'translated')::boolean, false) as tr,
             ord
      from jsonb_array_elements(coalesce(p_tags, '[]'::jsonb)) with ordinality as a(e, ord)
      where length(trim(coalesce(e->>'name', ''))) > 0
    ) s
    group by nm
    order by min(ord)
    limit 5
  loop
    insert into public.tags (name, name_i18n, translated)
    values (v_name, v_i18n, coalesce(v_tr, false))
    on conflict (name) do update set name = excluded.name  -- no-op: conserva i18n
    returning id into v_tag;

    insert into public.recommendation_tags (recommendation_id, tag_id)
    values (v_rec, v_tag)
    on conflict do nothing;
  end loop;

  return v_rec;
end;
$$;

revoke execute on function
  public.create_recommendation(text, jsonb, text, jsonb, text, uuid, boolean, jsonb)
  from public, anon;
grant execute on function
  public.create_recommendation(text, jsonb, text, jsonb, text, uuid, boolean, jsonb)
  to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- suggest_tags v2: autocompletado por etiqueta localizada, ordenado por uso.
-- Devuelve el nombre canónico (para enlazar) y el label localizado (para mostrar).
-- ─────────────────────────────────────────────────────────────────────────
drop function if exists public.suggest_tags(text, integer);

create or replace function public.suggest_tags(
  p_query  text default '',
  p_limit  int  default 8,
  p_locale text default 'en'
)
returns table (name text, label text, uses bigint)
language sql
stable
security definer
set search_path = public
as $$
  select t.name,
         coalesce(t.name_i18n ->> p_locale, t.name) as label,
         count(rt.tag_id) as uses
  from public.tags t
  left join public.recommendation_tags rt on rt.tag_id = t.id
  where coalesce(trim(p_query), '') = ''
     or coalesce(t.name_i18n ->> p_locale, t.name) ilike lower(trim(p_query)) || '%'
     or t.name ilike lower(trim(p_query)) || '%'
  group by t.id
  order by uses desc, label asc
  limit greatest(1, least(coalesce(p_limit, 8), 20));
$$;

revoke execute on function public.suggest_tags(text, int, text) from public, anon;
grant execute on function public.suggest_tags(text, int, text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- find_similar_in_category: recomendaciones internas similares dentro de una
-- categoría, comparando contra el título localizado del usuario. pg_trgm.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.find_similar_in_category(
  q          text,
  p_category uuid,
  p_locale   text default 'en',
  threshold  real default 0.2,
  p_limit    int  default 8
)
returns table (id uuid, title text, title_i18n jsonb, similarity real)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select r.id, r.title, r.title_i18n,
         similarity(coalesce(r.title_i18n ->> p_locale, r.title), q) as similarity
  from public.recommendations r
  where r.category_id = p_category
    and similarity(coalesce(r.title_i18n ->> p_locale, r.title), q) >= threshold
  order by similarity desc
  limit greatest(1, least(coalesce(p_limit, 8), 20));
$$;

revoke execute on function public.find_similar_in_category(text, uuid, text, real, int) from public, anon;
grant execute on function public.find_similar_in_category(text, uuid, text, real, int) to authenticated;
