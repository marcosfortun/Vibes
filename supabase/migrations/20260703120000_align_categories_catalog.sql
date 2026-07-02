-- Alinea el catálogo de categorías de todos los entornos con el documento de
-- diseño (release-1-3-0.md, "Propuesta de categorías iniciales", 21 categorías).
-- Producción se creó a mano y se desvió: tenía "Cine" en vez de "Película" y le
-- faltaban "Show" y "Zona de acampada"; por eso el seed de category_providers
-- (que asigna por nombre exacto) nunca vinculó TMDB a cine y el autocompletado
-- caía siempre a la IA.
--
-- Idempotente: en entornos ya alineados (local) no cambia nada relevante.
-- NOTA: no toca las categorías extra que no estén en el documento (p. ej.
-- "Canción" en prod): eliminarlas requiere migrar sus recomendaciones y es una
-- decisión de producto.

-- 1) Renombra Cine → Película conservando el id (las recomendaciones existentes
--    siguen colgando de la misma categoría). Limpia la i18n para que el nombre
--    nuevo se muestre tal cual hasta que se retraduzca.
update public.categories
set name = 'Película', name_i18n = null, translated = false
where name = 'Cine'
  and not exists (select 1 from public.categories where name = 'Película');

-- 2) Inserta las categorías del documento que falten (icono/color del seed local).
insert into public.categories (name, icon, color) values
  -- En casa (azul)
  ('Serie de televisión', 'Tv',           '#2563eb'),
  ('Película',            'Clapperboard', '#2563eb'),
  ('Documental',          'Film',         '#2563eb'),
  ('Juego de mesa',       'Dices',        '#2563eb'),
  ('Juego VR',            'Glasses',      '#2563eb'),
  ('Videojuego',          'Gamepad2',     '#2563eb'),
  ('Grupo de música',     'Guitar',       '#2563eb'),
  ('Podcast',             'Podcast',      '#2563eb'),
  -- En la ciudad (rojo)
  ('Expo',                'Image',        '#dc2626'),
  ('Festival',            'PartyPopper',  '#dc2626'),
  ('Museo',               'Landmark',     '#dc2626'),
  ('Lugar emblemático',   'MapPin',       '#dc2626'),
  ('Monólogo',            'Mic',          '#dc2626'),
  ('Teatro',              'Drama',        '#dc2626'),
  ('Show',                'Star',         '#dc2626'),
  -- En el campo (verde)
  ('Ruta de ciclismo',    'Bike',         '#16a34a'),
  ('Ruta de senderismo',  'Footprints',   '#16a34a'),
  ('Vía ferrata',         'Mountain',     '#16a34a'),
  ('Zona de baño',        'Waves',        '#16a34a'),
  ('Zona de escalada',    'MountainSnow', '#16a34a'),
  ('Zona de acampada',    'Compass',      '#16a34a')
on conflict (name) do nothing;

-- 3) Vincula los proveedores del documento donde falten. Hay unique
--    (category_id, position), así que se inserta en la siguiente posición libre
--    y el orden definitivo se fija en el paso 4.
insert into public.category_providers (category_id, provider_id, position)
select c.id, p.id,
       coalesce((select max(cp.position) from public.category_providers cp
                 where cp.category_id = c.id), 0) + 1
from public.categories c
cross join public.providers p
where p.kind = 'tmdb'
  and c.name in ('Documental', 'Película', 'Serie de televisión')
on conflict (category_id, provider_id) do nothing;

insert into public.category_providers (category_id, provider_id, position)
select c.id, p.id,
       coalesce((select max(cp.position) from public.category_providers cp
                 where cp.category_id = c.id), 0) + 1
from public.categories c
cross join public.providers p
where p.kind = 'steam'
  and c.name in ('Juego VR', 'Videojuego')
on conflict (category_id, provider_id) do nothing;

-- IA como fallback en todas las categorías que aún no la tengan.
insert into public.category_providers (category_id, provider_id, position)
select c.id, p.id,
       coalesce((select max(cp.position) from public.category_providers cp
                 where cp.category_id = c.id), 0) + 1
from public.categories c
cross join public.providers p
where p.kind = 'ai'
  and not exists (
    select 1 from public.category_providers cp2
    where cp2.category_id = c.id and cp2.provider_id = p.id
  )
on conflict do nothing;

-- 4) Renumera 1..n por categoría: proveedores específicos primero, IA al final
--    (es el fallback). Desplazamiento previo a +1000 para no chocar con el
--    unique (category_id, position) durante la reasignación.
update public.category_providers set position = position + 1000;

update public.category_providers cp
set position = t.rn
from (
  select cp2.category_id, cp2.provider_id,
         row_number() over (
           partition by cp2.category_id
           order by (p.kind = 'ai'), cp2.position
         ) as rn
  from public.category_providers cp2
  join public.providers p on p.id = cp2.provider_id
) t
where cp.category_id = t.category_id and cp.provider_id = t.provider_id;
