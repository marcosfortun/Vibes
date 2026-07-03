-- Imagen opcional en recomendaciones (URL pública; p. ej. el póster de
-- TMDB/Steam que llega con el autocompletado, o una URL pegada por el usuario).
-- Se muestra en la vista ampliada de la tarjeta.
alter table public.recommendations
  add column image_url text check (image_url is null or image_url ~ '^https?://');

-- Mismo modelo de grants por columna que `url` (created_by sigue oculto).
grant select (image_url) on public.recommendations to authenticated;
grant insert (image_url) on public.recommendations to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- create_recommendation v3: añade p_image_url (opcional, al final con default
-- para no romper llamadas existentes). Reemplaza la firma v2.
-- ─────────────────────────────────────────────────────────────────────────
drop function if exists public.create_recommendation(text, jsonb, text, jsonb, text, uuid, boolean, jsonb);

create or replace function public.create_recommendation(
  p_title            text,
  p_title_i18n       jsonb,
  p_description      text,
  p_description_i18n jsonb,
  p_url              text,
  p_category         uuid,
  p_translated       boolean,
  p_tags             jsonb default '[]'::jsonb,  -- [{name, name_i18n, translated}]
  p_image_url        text  default null
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
    (title, title_i18n, description, description_i18n, url, image_url, category_id, created_by, translated)
  values (
    trim(p_title),
    p_title_i18n,
    nullif(trim(coalesce(p_description, '')), ''),
    p_description_i18n,
    nullif(trim(coalesce(p_url, '')), ''),
    nullif(trim(coalesce(p_image_url, '')), ''),
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
  public.create_recommendation(text, jsonb, text, jsonb, text, uuid, boolean, jsonb, text)
  from public, anon;
grant execute on function
  public.create_recommendation(text, jsonb, text, jsonb, text, uuid, boolean, jsonb, text)
  to authenticated;
