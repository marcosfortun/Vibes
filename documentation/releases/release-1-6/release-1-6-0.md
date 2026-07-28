# Mejoras release 1.6.0 — Optimización y consolidación de la v1

Este documento contiene las especificaciones para el desarrollo de la release.

Este documento es editable exclusivamente por el usuario propietario del proyecto.
Los demás interesados pueden leerlo y tomarlo como guía para desarrollar el proyecto, pero no pueden editarlo.

Release **de consolidación**: no añade funcionalidad nueva visible, sino que termina el trabajo de rendimiento que quedó fuera de la 1.5.0 (donde solo entraron las mejoras de bajo riesgo: región de Vercel, home en paralelo, skeletons y recorte del fallback de IA).

La siguiente será la **v2**, con las secciones hoy deshabilitadas ("suerte" y "quedada").

**Hecho**:

**En proceso**:

**Pendiente**:

## 1. Una sola resolución de sesión y perfil por petición

Hoy cada carga hace **4 llamadas `getUser()`** al Auth de Supabase (`proxy.ts`, `i18n/request.ts`,
`layout.tsx` y la página) y **3 consultas distintas a `users`** para tres columnas
(`language`, `skin`, `use_affinity_scoring`).

- Memoizar por petición la resolución de usuario + perfil (`React.cache`), de modo que
  layout, i18n y página compartan un único viaje.
- Unificar las tres consultas a `users` en una sola que devuelva las columnas necesarias.
- Valorar `getClaims()` de supabase-js, que valida el JWT en local sin viaje de red.
  Requiere activar **claves asimétricas** en el proyecto de producción: evaluar riesgo y
  hacerlo con su propia ronda de pruebas.

*Riesgo: medio (toca sesión, idioma y skin a la vez). Debe llevar pruebas específicas de
login, cambio de idioma y cambio de skin antes de mergear.*

## 2. Caché de búsquedas externas en base de datos

Hoy la caché es en memoria del proceso (`src/lib/providers/config.ts`, TTL 5 min): en
serverless no sobrevive entre invocaciones y no se comparte entre usuarios.

- Tabla `external_search_cache` con clave `(proveedor, categoría, consulta normalizada)`,
  resultado en JSONB y TTL de días/semanas, con limpieza periódica.
- Beneficio principal: la segunda persona que busca "Dune" no vuelve a pagar la llamada
  (sobre todo la del modelo de IA).
- Mantener la caché en memoria como primera capa y añadir una capa LRU en cliente para el
  caso "borro lo escrito y lo vuelvo a escribir".

## 3. Resultados del alta en dos fases

Aunque el refactor de la 1.5.0 quitó el bloqueo habitual (la IA ya solo actúa como
fallback), cuando el fallback entra el usuario espera a que el modelo responda.

- Devolver primero los resultados del catálogo interno (consulta rápida) y añadir los
  externos cuando lleguen, con un indicador de "buscando en fuentes externas…".

## 4. Caché de catálogos estables en servidor

- Categorías y proveedores por categoría cambian muy poco: cachearlos en servidor
  (`unstable_cache` con etiqueta) e invalidar cuando el admin los edite.
- Amigos **no** se cachea: cambia con acciones del usuario.

## 5. Router cache y prefetch

- Configurar `experimental.staleTimes.dynamic` para que volver a una pestaña ya visitada
  sea instantáneo. Decidir el valor con cuidado: un valor alto muestra datos obsoletos
  después de valorar o guardar una recomendación.
- Prefetch explícito en los enlaces del dock.

## 6. Renderizado incremental de las listas

- Pintar ~30 tarjetas y cargar más al hacer scroll, **sobre datos ya descargados** (una
  sola petición trae hasta 200 filas, y eso no es hoy el cuello de botella).
- La paginación real en servidor exige mover el scoring por afinidad a una RPC SQL:
  hacerlo solo si el catálogo crece a miles de recomendaciones.

## 7. Verificación

- Medir antes/después en **producción** (la latencia entre regiones no se reproduce en
  local). El propietario hace la medición manual.
- Como referencia, la 1.5.0 dejó las funciones en `dub1` (Dublín), pegadas al proyecto de
  Supabase en `eu-west-1`.
