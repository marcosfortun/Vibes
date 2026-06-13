-- ─────────────────────────────────────────────────────────────────────────
-- Datos semilla para PRUEBAS FUNCIONALES (no es seed de migración).
-- Ejecutar contra la BD local:
--   docker exec -i supabase_db_vibecheck psql -U postgres -d postgres < scripts/seed-pruebas.sql
--
-- Idempotente: borra y regenera SOLO los datos de usuarios que NO son
-- marcos.fortun@gmail.com. El usuario de Marcos (admin), su recomendación
-- "Witcher 3" y su valoración quedan INTACTOS.
--
-- Iconos: solo nombres de la whitelist de src/components/category-icon.tsx.
-- Colores por zona:  En casa = azul #2563eb · En la ciudad = rojo #dc2626 ·
--                    En el campo = verde #16a34a.
-- Ratings válidos: -1 (no me gusta), 1 (me gusta), 2 (me gusta mucho).
-- global_score y affinity los calculan los triggers automáticamente.
-- ─────────────────────────────────────────────────────────────────────────

begin;

-- Id de Marcos para excluirlo de cualquier borrado/regeneración.
-- (Se usa vía subconsulta por email en cada sentencia.)

-- 1) Limpieza de datos previos de usuarios distintos de Marcos.
--    Borrar interacciones primero revierte global_score/affinity vía triggers.
delete from public.user_interactions
  where user_id <> (select id from public.users where email = 'marcos.fortun@gmail.com');

delete from public.recommendations
  where created_by <> (select id from public.users where email = 'marcos.fortun@gmail.com');

-- Baseline de afinidad limpio (sin tocar las filas salientes de Marcos).
update public.friendships set affinity = 5.0
  where user_id <> (select id from public.users where email = 'marcos.fortun@gmail.com');

-- 2) Categorías (21). Idempotente por nombre único.
insert into public.categories (name, icon, color) values
  -- En casa (azul)
  ('Serie de televisión', 'Tv',          '#2563eb'),
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
on conflict (name) do update
  set icon = excluded.icon, color = excluded.color;

-- 3) Recomendaciones (~35) creadas por varios usuarios (nunca Marcos).
insert into public.recommendations (title, description, url, category_id, created_by)
select v.title, v.description, v.url, c.id, u.id
from (values
  -- En casa
  ('Breaking Bad', 'Un profesor de química se convierte en fabricante de metanfetamina. Imprescindible.', 'https://www.imdb.com/title/tt0903747/', 'Serie de televisión', 'alice@example.com'),
  ('The Last of Us', 'Adaptación del videojuego: drama postapocalíptico con grandes interpretaciones.', 'https://www.imdb.com/title/tt3581920/', 'Serie de televisión', 'bob@example.com'),
  ('Dune: Parte Dos', 'Segunda entrega épica de Villeneuve. Imagen y sonido espectaculares.', 'https://www.imdb.com/title/tt15239678/', 'Película', 'carol@example.com'),
  ('Todo a la vez en todas partes', 'Multiverso, comedia y emoción. Ganadora de varios Óscar.', 'https://www.imdb.com/title/tt6710474/', 'Película', 'manolo@example.com'),
  ('Nuestro planeta', 'Documental de naturaleza narrado por Attenborough. Visualmente increíble.', 'https://www.netflix.com/title/80049832', 'Documental', 'paquita@example.com'),
  ('El dilema de las redes', 'Cómo las redes sociales manipulan nuestra atención. Para reflexionar.', 'https://www.netflix.com/title/81254224', 'Documental', 'tester@example.com'),
  ('Catan', 'El clásico de construir y comerciar. Perfecto para 3-4 jugadores.', 'https://www.catan.com/', 'Juego de mesa', 'alice@example.com'),
  ('Aventureros al tren', 'Construye rutas de tren por el mapa. Fácil de aprender, muy rejugable.', 'https://www.daysofwonder.com/tickettoride/', 'Juego de mesa', 'bob@example.com'),
  ('Beat Saber', 'Cortar bloques al ritmo de la música en VR. Adictivo y deportivo.', 'https://beatsaber.com/', 'Juego VR', 'carol@example.com'),
  ('Half-Life: Alyx', 'La obra maestra de la realidad virtual. Inmersión total.', 'https://www.half-life.com/alyx', 'Juego VR', 'tester@example.com'),
  ('Elden Ring', 'Mundo abierto de FromSoftware. Difícil, vasto y memorable.', 'https://store.steampowered.com/app/1245620/', 'Videojuego', 'bob@example.com'),
  ('Hollow Knight', 'Metroidvania precioso y desafiante con una banda sonora soberbia.', 'https://store.steampowered.com/app/367520/', 'Videojuego', 'manolo@example.com'),
  ('Vetusta Morla', 'Indie rock español con directos potentes. "Mismas calles, otras manos".', 'https://www.vetustamorla.com/', 'Grupo de música', 'paquita@example.com'),
  ('Arctic Monkeys', 'Del garage rock al lounge. "AM" es un disco redondo.', 'https://www.arcticmonkeys.com/', 'Grupo de música', 'alice@example.com'),
  ('Nadie Sabe Nada', 'Improvisación y humor absurdo con Buenafuente y Romero. Para reír en el coche.', 'https://www.lasexta.com/programas/nadie-sabe-nada/', 'Podcast', 'carol@example.com'),
  ('The Wild Project', 'Entrevistas largas y variadas. Para los que les gustan las conversaciones.', 'https://www.youtube.com/@TheWildProject', 'Podcast', 'tester@example.com'),
  -- En la ciudad
  ('Expo Sorolla', 'Muestra del maestro de la luz mediterránea. Color puro.', 'https://www.museosorolla.es/', 'Expo', 'alice@example.com'),
  ('Primavera Sound', 'Festival de referencia en Barcelona. Cartel enorme y variado.', 'https://www.primaverasound.com/', 'Festival', 'bob@example.com'),
  ('Mad Cool', 'Macrofestival en Madrid con cabezas de cartel internacionales.', 'https://madcoolfestival.es/', 'Festival', 'manolo@example.com'),
  ('Museo del Prado', 'Pinacoteca imprescindible: Velázquez, Goya, El Greco.', 'https://www.museodelprado.es/', 'Museo', 'carol@example.com'),
  ('Museo Reina Sofía', 'Arte contemporáneo. El "Guernica" merece la visita por sí solo.', 'https://www.museoreinasofia.es/', 'Museo', 'paquita@example.com'),
  ('Sagrada Família', 'La basílica inacabada de Gaudí. La luz del interior es mágica.', 'https://sagradafamilia.org/', 'Lugar emblemático', 'tester@example.com'),
  ('Acueducto de Segovia', 'Ingeniería romana en pleno centro. Impresiona de cerca.', 'https://turismodesegovia.com/', 'Lugar emblemático', 'alice@example.com'),
  ('Monólogo de Ignatius', 'Humor inteligente y mala leche. Garantía de carcajada.', 'https://www.ignatiusfarray.com/', 'Monólogo', 'bob@example.com'),
  ('El Rey León (Musical)', 'Producción espectacular en Madrid. Vestuario y música apabullantes.', 'https://www.elreyleon.es/', 'Teatro', 'carol@example.com'),
  ('La Función que Sale Mal', 'Comedia donde todo se desmorona en escena. Para llorar de risa.', 'https://lafuncionquesalemal.es/', 'Teatro', 'manolo@example.com'),
  ('Cirque du Soleil', 'Acrobacias, música en directo y puesta en escena de otro nivel.', 'https://www.cirquedusoleil.com/', 'Show', 'paquita@example.com'),
  -- En el campo
  ('Vía Verde de la Sierra', 'Antigua vía de tren reconvertida. Túneles y buitres leonados.', 'https://www.viasverdes.com/', 'Ruta de ciclismo', 'tester@example.com'),
  ('Ruta del Cares', 'La "Garganta Divina" en Picos de Europa. Senderismo de postal.', 'https://www.turismoasturias.es/', 'Ruta de senderismo', 'alice@example.com'),
  ('Caminito del Rey', 'Pasarelas colgadas sobre el desfiladero. No apto para el vértigo.', 'https://www.caminitodelrey.info/', 'Ruta de senderismo', 'bob@example.com'),
  ('Ferrata de la Hermida', 'Vía ferrata con tirolinas sobre el desfiladero. Adrenalina pura.', 'https://www.cantur.com/', 'Vía ferrata', 'manolo@example.com'),
  ('Playa de las Catedrales', 'Arcos de roca esculpidos por el mar en Galicia. Ir con marea baja.', 'https://www.turismo.gal/', 'Zona de baño', 'carol@example.com'),
  ('Pozas de Oza', 'Piscinas naturales de agua fría en plena montaña. Refrescante.', 'https://turismodearagon.com/', 'Zona de baño', 'paquita@example.com'),
  ('Siurana', 'Meca de la escalada deportiva en Tarragona. Roca caliza de calidad.', 'https://www.siurana.info/', 'Zona de escalada', 'tester@example.com'),
  ('Camping Ordesa', 'Acampada a las puertas del parque nacional. Estrellas garantizadas.', 'https://www.campingordesa.es/', 'Zona de acampada', 'alice@example.com')
) as v(title, description, url, cat, email)
join public.categories c on c.name = v.cat
join public.users u on u.email = v.email;

-- 4) Interacciones: valoraciones (-1/1/2) y "Mi Lista" (saved) de varios
--    usuarios, incluyendo recomendaciones que NO crearon ellos.
--    Cada (usuario, recomendación) aparece una sola vez; saved y rating
--    conviven en la misma fila cuando procede.
insert into public.user_interactions (user_id, recommendation_id, saved, rating)
select u.id, r.id, v.saved, v.rating
from (values
  -- alice
  ('alice@example.com',  'Breaking Bad',                   true,  2),
  ('alice@example.com',  'Elden Ring',                     true,  1),
  ('alice@example.com',  'Dune: Parte Dos',                false, 2),
  ('alice@example.com',  'Catan',                          true,  1),
  ('alice@example.com',  'Primavera Sound',                true,  null),
  ('alice@example.com',  'Museo del Prado',                false, 1),
  ('alice@example.com',  'Ruta del Cares',                 true,  2),
  ('alice@example.com',  'Nuestro planeta',                false, 1),
  ('alice@example.com',  'The Wild Project',               false, -1),
  ('alice@example.com',  'Cirque du Soleil',               true,  null),
  -- bob
  ('bob@example.com',    'The Last of Us',                 true,  2),
  ('bob@example.com',    'Elden Ring',                     true,  2),
  ('bob@example.com',    'Breaking Bad',                   false, 2),
  ('bob@example.com',    'Dune: Parte Dos',                false, 1),
  ('bob@example.com',    'Aventureros al tren',            true,  1),
  ('bob@example.com',    'Mad Cool',                       true,  null),
  ('bob@example.com',    'Caminito del Rey',               true,  2),
  ('bob@example.com',    'Half-Life: Alyx',                false, 1),
  ('bob@example.com',    'Vetusta Morla',                  false, 1),
  ('bob@example.com',    'Sagrada Família',                true,  1),
  ('bob@example.com',    'The Wild Project',               false, 2),
  -- carol
  ('carol@example.com',  'Dune: Parte Dos',                true,  2),
  ('carol@example.com',  'Beat Saber',                     true,  1),
  ('carol@example.com',  'Museo del Prado',                true,  2),
  ('carol@example.com',  'Nadie Sabe Nada',                true,  1),
  ('carol@example.com',  'El Rey León (Musical)',          true,  2),
  ('carol@example.com',  'Playa de las Catedrales',        true,  2),
  ('carol@example.com',  'Breaking Bad',                   false, 1),
  ('carol@example.com',  'Elden Ring',                     false, -1),
  ('carol@example.com',  'Arctic Monkeys',                 true,  null),
  ('carol@example.com',  'Caminito del Rey',               false, 2),
  ('carol@example.com',  'Primavera Sound',                true,  1),
  -- manolo
  ('manolo@example.com', 'Todo a la vez en todas partes',  true,  2),
  ('manolo@example.com', 'Hollow Knight',                  true,  2),
  ('manolo@example.com', 'Mad Cool',                       true,  1),
  ('manolo@example.com', 'La Función que Sale Mal',        true,  1),
  ('manolo@example.com', 'Ferrata de la Hermida',          true,  2),
  ('manolo@example.com', 'Elden Ring',                     false, 1),
  ('manolo@example.com', 'Dune: Parte Dos',                false, 1),
  ('manolo@example.com', 'Breaking Bad',                   false, -1),
  ('manolo@example.com', 'Vetusta Morla',                  false, 2),
  ('manolo@example.com', 'Museo Reina Sofía',              true,  null),
  ('manolo@example.com', 'The Last of Us',                 false, 1),
  -- paquita
  ('paquita@example.com','Nuestro planeta',                true,  2),
  ('paquita@example.com','Vetusta Morla',                  true,  2),
  ('paquita@example.com','Museo Reina Sofía',              true,  1),
  ('paquita@example.com','Cirque du Soleil',               true,  2),
  ('paquita@example.com','Pozas de Oza',                   true,  1),
  ('paquita@example.com','Breaking Bad',                   false, 2),
  ('paquita@example.com','Catan',                          false, 1),
  ('paquita@example.com','Elden Ring',                     true,  1),
  ('paquita@example.com','Arctic Monkeys',                 false, 2),
  ('paquita@example.com','Primavera Sound',                true,  2),
  ('paquita@example.com','Museo del Prado',                false, 1),
  -- tester
  ('tester@example.com', 'El dilema de las redes',         true,  1),
  ('tester@example.com', 'Half-Life: Alyx',                true,  2),
  ('tester@example.com', 'The Wild Project',               true,  1),
  ('tester@example.com', 'Sagrada Família',                true,  2),
  ('tester@example.com', 'Vía Verde de la Sierra',         true,  1),
  ('tester@example.com', 'Siurana',                        true,  2),
  ('tester@example.com', 'Elden Ring',                     false, 2),
  ('tester@example.com', 'Breaking Bad',                   false, 1),
  ('tester@example.com', 'Dune: Parte Dos',                false, -1),
  ('tester@example.com', 'Catan',                          true,  null),
  ('tester@example.com', 'Nadie Sabe Nada',                false, 2)
) as v(email, title, saved, rating)
join public.users u on u.email = v.email
join public.recommendations r on r.title = v.title;

commit;
