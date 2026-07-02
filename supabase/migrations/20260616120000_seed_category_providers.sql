-- Siembra las relaciones category_providers (faltaban: la migración de providers
-- solo creaba el catálogo, no las asignaciones). Sin esto, la búsqueda externa del
-- alta (paso 1) no tiene proveedores en ninguna categoría y nunca devuelve nada.
--
-- Idempotente y robusta frente a catálogos de categorías distintos:
--   - TMDB (posición 1) para cine, series y documentales.
--   - Steam (posición 1) para videojuegos y juegos VR.
--   - IA como fallback universal: se añade a CUALQUIER categoría en la siguiente
--     posición libre (posición 1 si no tenía proveedor específico).

-- TMDB en cine/series/documental.
insert into public.category_providers (category_id, provider_id, position)
select c.id, p.id, 1
from public.categories c
cross join public.providers p
where p.kind = 'tmdb'
  and c.name in ('Documental', 'Película', 'Serie de televisión')
on conflict do nothing;

-- Steam en videojuegos y juegos VR.
insert into public.category_providers (category_id, provider_id, position)
select c.id, p.id, 1
from public.categories c
cross join public.providers p
where p.kind = 'steam'
  and c.name in ('Juego VR', 'Videojuego')
on conflict do nothing;

-- IA como fallback en todas las categorías, en la siguiente posición libre.
insert into public.category_providers (category_id, provider_id, position)
select c.id, p.id,
       coalesce(
         (select max(cp.position) from public.category_providers cp where cp.category_id = c.id),
         0
       ) + 1
from public.categories c
cross join public.providers p
where p.kind = 'ai'
  and not exists (
    select 1 from public.category_providers cp2
    where cp2.category_id = c.id and cp2.provider_id = p.id
  )
on conflict do nothing;
