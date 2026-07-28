# Mejoras release 1.5.0

Este documento contiene las especificaciones para el desarrollo de la release.

Este documento es editable exclusivamente por el usuario propietario del proyecto.
Los demás interesados pueden leerlo y tomarlo como guía para desarrollar el proyecto, pero no pueden editarlo.

**Hecho**:

- Posibilidad de cargar recomendaciones en masa copiando cada título en una línea. Aplicar autocompletado en background.
- Vista comprimida de la lista de recomendaciones. Botón "más info" que despliega la tarjeta a pantalla completa.
- Corregir el icono y el nombre de instalación en el escritorio. Deberían ser los de la skin que tengas seleccionada.
- Posibilidad de añadir una imagen a las recomendaciones. En el caso de ser recomendación generada por IA, la imagen se obtiene de Wikipedia o de las fuentes especializadas por categoría.
- Añadida la fuente especializada "BoardGameGeek" como proveedor para juegos de mesa.

**En proceso**:



**Pendiente**:

- Optimizaciones:
  - Caché: categorías, idioma...
  - Paginación de listas de recomendaciones.

Diagnóstico
1. Cada click paga ~13 viajes de red en serie a Supabase… cruzando el Atlántico. Este es el hallazgo gordo:

Tu Supabase está en eu-west-1 (Irlanda) (lo acabo de verificar con supabase projects list), pero no hay vercel.json, así que las funciones de Vercel corren en la región por defecto: iad1 (Washington DC). Cada query paga ~90-100 ms solo de latencia transatlántica.
Y son muchas queries, todas secuenciales. En una carga de la home: proxy.ts hace getUser() (1 viaje de red al Auth de Supabase), request.ts hace otro getUser() + query de users.language (2), layout.tsx otro getUser() + users.skin (2), y page.tsx hace getUser() + 7 queries encadenadas con await uno detrás de otro (8). Total: ~13 round-trips seriales × ~100 ms ≈ 1,3 s de red pura, antes de contar cold starts.
2. El autocompletado bloquea todo hasta que responde Haiku. En searchCandidates la cadena es secuencial: resolver locale (2 viajes) → RPC de similitud interna → query de categoría → query de proveedores → llamada externa. Los resultados internos (que tarda milisegundos en tener) se quedan retenidos esperando a Haiku, que con structured output y 8 candidatos tarda fácilmente 2-4 s. Y no hay caché en ningún nivel: teclear "matrix", borrar y volver a teclear "matrix" paga Haiku dos veces.

3. Todo es SSR dinámico sin nada de caché de navegación. Cada <Link> del dock dispara un render completo en servidor. No hay loading.tsx, así que el click no da feedback visual hasta que llega todo → sensación de "no responde".

Lo que ya está bien: las imágenes de las tarjetas usan loading="lazy", y el volumen de datos (≤200 filas en Tendencias) no es el cuello de botella — es un solo viaje.

Plan propuesto (por orden de impacto/esfuerzo)
Fase 1 — Red y servidor (el 80% de la mejora, sin cambiar UX)
Mover las funciones de Vercel a Europa: crear vercel.json con "regions": ["dub1"] (Dublín, pegado a eu-west-1). En Hobby se puede fijar una región. Los ~100 ms/viaje pasan a ~5-15 ms. Es un cambio de 3 líneas y probablemente el que más se note.
Eliminar los getUser() redundantes: son 4 llamadas de red al Auth por request. Opciones: envolver la resolución de usuario+perfil en React cache() (memoiza por request, sirve para proxy no, pero sí para i18n/layout/page), y/o migrar a getClaims() de supabase-js, que verifica el JWT en local sin viaje de red (requiere activar claves asimétricas en el proyecto). Además, unificar las 3 queries a users (language, skin, use_affinity_scoring) en una sola compartida por request.
Paralelizar las queries de la home con Promise.all en dos tandas (las 4 primeras son independientes entre sí; las de listas dependen de aquellas).
Resultado esperado: de ~13 viajes seriales transatlánticos a ~3-4 tandas locales → la home debería pasar de segundos a unos pocos cientos de ms.

Fase 2 — Autocompletado
Resultados en dos fases: devolver los internos inmediatamente (RPC trigram, rápido) y añadir los externos cuando lleguen. Dos server actions (o la misma con un flag), y el componente pinta primero lo interno con un "buscando en fuentes externas…".
Caché persistente de búsquedas externas en una tabla de Supabase (external_search_cache, clave = proveedor+categoría+query normalizada, TTL de días/semanas). Es mejor que solo cachear en el front: en serverless la memoria del proceso no sobrevive, y una tabla beneficia a todos los usuarios — la segunda persona que busca "Dune" no paga Haiku. Tu idea de cachear los últimos 100 en el front la mantengo como capa extra (Map LRU en el cliente) para el caso "borro y reescribo".
Paralelizar dentro de la action: la RPC interna, la query de categoría y la de proveedores pueden ir en paralelo; hoy van en serie.
Afinar la llamada a Haiku: bajar de 8 a 5 candidatos y recortar max_tokens (el coste dominante es la generación de tokens; menos candidatos = respuesta más rápida).
Fase 3 — Navegación percibida como instantánea
loading.tsx con skeletons en home, /new, /friends, /settings: el click responde al instante aunque el SSR tarde.
Router cache: configurar experimental.staleTimes.dynamic (p. ej. 30 s) para que volver a una pestaña ya visitada sea instantáneo, más prefetch explícito en los links del dock.
Cachear catálogos estables en servidor (tu idea 2): categorías y proveedores casi nunca cambian → unstable_cache con tag e invalidación (revalidateTag) cuando el admin los edite. Idiomas ya es estático local. Amigos lo dejaría sin caché (cambia con acciones del usuario y ya quedará rápido con la Fase 1).
Fase 4 — Paginación (tu idea 3, pero la última)
La dejaría para el final y descafeinada: traer 200 filas es un viaje, no es lo que duele hoy. Además, con el scoring por afinidad calculado en código sobre esas 200 filas, paginar de verdad exige mover el scoring a una RPC SQL. Propuesta pragmática: renderizado incremental en cliente (pintar 30 tarjetas y cargar más al hacer scroll, sobre datos ya descargados) ahora, y paginación real con RPC solo si el catálogo crece a miles.

Verificación
Medir antes/después con Server-Timing en las páginas clave y probar con el navegador contra prod (o preview de Vercel, porque la latencia de región no se reproduce en local).

Sobre tus tres ideas
Caché de búsquedas (idea 1): sí, pero la versión servidor (tabla con TTL) da mucho más que la de front; hago ambas.
Caché de listas (idea 2): sí para categorías/proveedores (caché de servidor con tags); idiomas ya no viaja; amigos no compensa.
Paginación (idea 3): de acuerdo en el scroll infinito pero como renderizado incremental; la petición única de ~200 filas no es el problema y paginar el scoring por afinidad tiene coste alto ahora mismo.
Si te encaja el plan (o la parte que quieras), el siguiente paso lógico sería escribir la especificación en documentation/releases/ — dime si esto va como release nueva (¿1.5.1 o 1.6.0?) o si quieres meter alguna fase dentro de la 1.5.0 antes de cerrarla. Yo metería como mínimo la Fase 1 en la 1.5.0: es pequeña, de bajo riesgo, y sin ella vas a percibir la release como lenta la pruebes cuando la pruebes.
