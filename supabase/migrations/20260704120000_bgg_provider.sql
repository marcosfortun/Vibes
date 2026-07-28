-- BoardGameGeek como proveedor de búsqueda externa para juegos de mesa.
--
-- Hasta ahora "Juego de mesa" solo tenía el proveedor IA: los resultados del
-- alta eran sugerencias del modelo, sin ficha real. El adaptador `bgg`
-- (src/lib/providers/bgg.ts) consulta la XML API2 de BoardGameGeek y devuelve
-- título, descripción, imagen y enlace a la ficha.
--
-- Requiere BGG_API_TOKEN (la API dejó de ser pública a finales de 2025). Sin
-- token el adaptador devuelve [] y la búsqueda cae al siguiente proveedor de la
-- categoría (IA), es decir: es seguro aplicar esta migración antes de tener el
-- token. Registro: https://boardgamegeek.com/using_the_xml_api
--
-- Idempotente.

insert into public.providers (kind, name) values
  ('bgg', 'BoardGameGeek')
on conflict (kind) do nothing;

-- Vincula BGG a "Juego de mesa" en la siguiente posición libre; el orden
-- definitivo (específicos primero, IA al final) lo fija el renumerado de abajo.
insert into public.category_providers (category_id, provider_id, position)
select c.id, p.id,
       coalesce((select max(cp.position) from public.category_providers cp
                 where cp.category_id = c.id), 0) + 1
from public.categories c
cross join public.providers p
where p.kind = 'bgg'
  and c.name = 'Juego de mesa'
on conflict (category_id, provider_id) do nothing;

-- Renumera 1..n por categoría: proveedores específicos primero, IA al final
-- (es el fallback). Desplazamiento previo a +1000 para no chocar con el
-- unique (category_id, position) durante la reasignación.
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
