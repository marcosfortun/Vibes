-- Refactor de la búsqueda por proveedores (release 1.5.0).
--
-- 1) `providers` pasa a describir QUÉ sabe hacer cada proveedor (búsqueda y/o
--    resolución de imagen) y qué clave necesita. La fuente de verdad del
--    comportamiento sigue siendo el registro en código
--    (src/lib/providers/registry.ts); estas columnas lo replican para la futura
--    UI de admin, y un test comprueba que no se desincronicen.
-- 2) La IA deja de ser "proveedor de categoría" y pasa a ser el fallback del
--    sistema (configurado en src/lib/providers/config.ts). Su identificador
--    incluye modelo y versión para poder añadir otros modelos más adelante.
-- 3) Alta de iTunes (podcasts y música) y de Wikipedia (solo imagen).
--
-- Idempotente.

-- ── 1. Capacidades ──────────────────────────────────────────────────────────
alter table public.providers
  add column if not exists can_search        boolean not null default true,
  add column if not exists can_resolve_image boolean not null default false,
  add column if not exists requires_key      text;

grant select (id, kind, name, can_search, can_resolve_image, requires_key)
  on public.providers to authenticated;

-- ── 2. Catálogo de proveedores ──────────────────────────────────────────────
-- La IA pasa de 'ai' a 'ai_haiku_4.5' (prefijo + modelo + versión).
update public.providers
set kind = 'ai_haiku_4.5', name = 'Claude Haiku 4.5'
where kind = 'ai';

insert into public.providers (kind, name) values
  ('itunes',    'iTunes'),
  ('wikipedia', 'Wikipedia')
on conflict (kind) do nothing;

update public.providers set
  can_search        = kind in ('tmdb', 'steam', 'bgg', 'itunes', 'ai_haiku_4.5'),
  can_resolve_image = kind in ('tmdb', 'steam', 'bgg', 'itunes', 'wikipedia'),
  requires_key      = case kind
                        when 'tmdb'          then 'TMDB_API_KEY'
                        when 'bgg'           then 'BGG_API_TOKEN'
                        when 'ai_haiku_4.5'  then 'ANTHROPIC_API_KEY'
                        else null
                      end;

-- ── 3. Relación con categorías ──────────────────────────────────────────────
-- La IA ya no se asigna por categoría: es el fallback global.
delete from public.category_providers cp
using public.providers p
where p.id = cp.provider_id and p.kind = 'ai_haiku_4.5';

-- iTunes para podcasts y grupos de música (posición libre; se renumera abajo).
insert into public.category_providers (category_id, provider_id, position)
select c.id, p.id,
       coalesce((select max(cp.position) from public.category_providers cp
                 where cp.category_id = c.id), 0) + 1
from public.categories c
cross join public.providers p
where p.kind = 'itunes'
  and c.name in ('Podcast', 'Grupo de música')
on conflict (category_id, provider_id) do nothing;

-- Renumera 1..n por categoría conservando el orden actual. Desplazamiento
-- previo a +1000 para no chocar con el unique (category_id, position).
update public.category_providers set position = position + 1000;

update public.category_providers cp
set position = t.rn
from (
  select cp2.category_id, cp2.provider_id,
         row_number() over (partition by cp2.category_id order by cp2.position) as rn
  from public.category_providers cp2
) t
where cp.category_id = t.category_id and cp.provider_id = t.provider_id;

-- ── 4. Enriquecimiento de fichas existentes ─────────────────────────────────
-- Cuando una ficha del catálogo gana el dedup a un resultado externo que sí
-- traía imagen/URL, se aprovechan sus datos para completar los huecos.
--
-- Seguridad: `authenticated` NO tiene UPDATE sobre recommendations (daría pie a
-- reescribir fichas ajenas). Esta RPC es SECURITY DEFINER y solo escribe donde
-- hay NULL; nunca sobrescribe ni toca textos. Ver pd-security-design.md.
create or replace function public.enrich_recommendation(
  p_id        uuid,
  p_url       text default null,
  p_image_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  update public.recommendations r
  set url = case
              when r.url is null and p_url ~ '^https?://' then p_url
              else r.url
            end,
      image_url = case
                    when r.image_url is null and p_image_url ~ '^https?://' then p_image_url
                    else r.image_url
                  end
  where r.id = p_id
    and (
      (r.url is null and p_url ~ '^https?://')
      or (r.image_url is null and p_image_url ~ '^https?://')
    );
end;
$$;

revoke execute on function public.enrich_recommendation(uuid, text, text) from public, anon;
grant execute on function public.enrich_recommendation(uuid, text, text) to authenticated;
