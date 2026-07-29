# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/) y versionado [SemVer](https://semver.org/).

## [Unreleased] — release 1.5.0 (en `release/1.5.0`, sin desplegar)

### Added
- **BoardGameGeek como proveedor de búsqueda externa** para la categoría "Juego de mesa" (adaptador `bgg` + migración `20260704120000_bgg_provider.sql`, con la IA como fallback). Devuelve título, descripción, imagen y enlace a la ficha del juego. Requiere `BGG_API_TOKEN` (la XML API de BGG dejó de ser pública en 2025): sin token el adaptador se omite sin llamada fallida y la búsqueda cae a la IA, como hasta ahora.
- **Carga masiva de recomendaciones** (`/new/bulk`, enlace desde el alta): se elige una categoría, se pegan varios títulos (uno por línea, hasta 50) y por cada uno se muestran los candidatos del autocompletado para elegir el mejor, crear solo con el título u omitir. Los candidatos del siguiente título se piden en segundo plano mientras se decide. Resumen final con qué se creó y cómo.
- **Imagen en las recomendaciones**: nueva columna `image_url` (RPC `create_recommendation` v3). Se autorellena con el póster de **TMDB** (`poster_path`) y la carátula de **Steam** (`header_image`) cuando el resultado viene del autocompletado, y hay un campo "URL de la imagen" editable en el alta. Se muestra en la vista ampliada de la tarjeta.
- **Imagen también para resultados de IA y altas "solo título"** (`resolveImage`): al crear (alta simple y carga masiva), si el candidato no trae imagen se resuelve en cascada best-effort con timeout corto — fuente especializada por categoría primero (**TMDB** cine/series/documental, **Steam** videojuegos/VR, **iTunes Search** podcasts y música sin API key, y **BoardGameGeek** juegos de mesa — BGG cerró su XML API a finales de 2025 y ahora requiere registro: solo se usa si hay `BGG_API_TOKEN`; sin él, los juegos de mesa resuelven por Wikipedia) y **Wikipedia** (pageimages, wiki del idioma con fallback a la inglesa) como red universal para el resto (museos, rutas, festivales…). La IA ahora devuelve `wikiTitle` (título exacto del artículo) para afinar la búsqueda sin inventar URLs. Además de la imagen, la fuente devuelve la **URL de la página de origen** (artículo de Wikipedia, ficha de TMDB/Steam/iTunes/BGG): si la recomendación no tenía URL, se usa esa — así el título y la imagen de las tarjetas creadas por IA son clicables. Si nada responde, la recomendación se crea sin imagen. *(Nota: la especializada va antes que Wikipedia — desviación del orden propuesto — porque da la imagen "de ficha": en pruebas reales, Wikipedia devolvía la foto del presentador de Radiolab en vez de la carátula.)*

### Changed
- **Búsqueda del alta rediseñada: abanico en paralelo con fallback de IA.** Cada categoría define una lista ordenada de hasta 5 proveedores que ahora se consultan **a la vez** (presupuesto común de 5 s: lo que no llega a tiempo se descarta, pero lo que responde cuenta) junto con el catálogo interno. Los resultados se mezclan, se filtran por similitud (**≥ 0.35**), el catálogo recibe **+0.10** de bonificación para subir posiciones, se deduplica (**gana siempre la ficha del catálogo**) y se muestran los **10 mejores**. Sustituye a la cascada "gana el primero que responda", que ocultaba resultados mejores de otros proveedores.
  - **La IA deja de ser un proveedor de categoría** y pasa a ser el *fallback del sistema*: entra cuando ningún proveedor especializado aporta un resultado válido (no hay proveedores, les falta la API key, fallan, expiran o lo que devuelven no se parece a la consulta). Sus resultados **no** se filtran por similitud, porque su relevancia es semántica: "arte moderno en Bilbao" → Museo Guggenheim (similitud tipográfica ≈ 0).
  - **Identificadores de proveedor con modelo y versión** (`ai` → `ai_haiku_4.5`), para poder añadir otros modelos como proveedores distintos. La interfaz sigue mostrando «IA»/«AI» para cualquier `ai_*` sin tocar los ficheros de idioma.
  - **Fallbacks y umbrales configurables en un único sitio** (`src/lib/providers/config.ts`): umbral, bonificación, modelo de fallback, fuente de imagen, máximos y tiempos.
  - **Similitud mejorada**: normaliza acentos y puntuación, y aplica un suelo de 0.6 cuando el título contiene la consulta como palabra completa ("catan" vs "Colonos de Catán" pasa de 0.21 a 0.60). **TMDB** pide además los textos **en el idioma del usuario**, así "El Padrino" deja de puntuar 0 contra "The Godfather".
  - **Menos ruido y menos coste**: la búsqueda arranca a partir de **3 caracteres**, con **1 s** de espera tras la última pulsación y caché en memoria por (categoría, consulta).
- **Fichas del catálogo que se enriquecen solas**: cuando una ficha existente gana el dedup a un resultado externo que traía imagen o enlace, esos datos viajan con la selección y **rellenan sus huecos** al elegirla (RPC `enrich_recommendation`, que nunca sobrescribe lo que ya hay). Menos duplicados y fichas más completas con el uso.
- **Cadena de imagen unificada**: al crear, la imagen se resuelve recorriendo los proveedores de la categoría que saben resolverla —consultados con el **título canónico** ya elegido, no con lo que tecleó el usuario— y, como último recurso, Wikipedia. Es lo que permite que un podcast encontrado por IA acabe con su carátula real de iTunes.
- **Vista compacta de las listas** (Mi Lista / De Amigos / Tendencias): cada recomendación pasa a una fila de una línea (icono de categoría, título, calificar, guardar). La descripción, el scoring y las etiquetas se muestran en la **vista ampliada** a pantalla completa.
- **Acabado de la vista ampliada (feedback de pruebas)**: se abre pulsando el **título** de la fila (adiós al botón "más info"); el título **y la imagen** enlazan a la URL en **pestaña nueva**; la imagen se muestra **completa y centrada** (sin recortes, `object-contain`, máx. 240px de alto, y las panorámicas se encogen al ancho disponible sin desbordar); botón de cierre con la estética estándar del botón de volver; **scoring abajo a la izquierda con etiqueta localizada** («Puntuación»/“Scoring”/«Score»/«Pontuação»); el **scroll afecta solo a imagen y descripción** — título, etiquetas, scoring y acciones quedan siempre visibles.
- **"Suerte" y "Quedada" deshabilitadas temporalmente** en el dock para esta release ("suerte" aún no funciona; "quedada" pendiente de revisión del propietario): atenuadas, sin navegación y con `aria-disabled`.
- **Instalación PWA por skin**: el manifest es dinámico (`/manifest.webmanifest?skin=<style>`); la app se instala con el **icono y los colores de la skin activa** manteniendo el nombre "Vibes". El `<link rel="manifest">` se sincroniza con la skin en el arranque y al cambiarla. *(Limitación: lo ya instalado no se actualiza al cambiar de skin; lo cachea el SO.)*

### Database
- Migración `20260703140000_recommendation_image.sql`: columna `image_url` + grants por columna y `create_recommendation` v3 (`p_image_url`).
- Migración `20260728120000_providers_refactor.sql`: `providers` gana `can_search`, `can_resolve_image` y `requires_key` (describen las capacidades para la futura UI de admin; el nombre de la variable de entorno, nunca su valor); `ai` pasa a `ai_haiku_4.5` y se desvincula de todas las categorías; alta de **iTunes** (asignado a Podcast y Grupo de música) y **Wikipedia** en el catálogo; y RPC `enrich_recommendation` (`SECURITY DEFINER`, solo rellena NULL) documentada en `pd-security-design.md`.

### Performance
- **Funciones desplegadas en Dublín** (`vercel.json` con `"regions": ["dub1"]`, pegado al proyecto de Supabase en `eu-west-1`). Antes corrían en Washington: cada consulta pagaba ~100 ms de latencia transatlántica y una carga de la home encadenaba una docena.
- **Home en paralelo**: las 7 consultas secuenciales pasan a 3 tandas según sus dependencias reales (sesión+idioma → datos del usuario → listas).
- **Skeletons de carga propios en las nueve pantallas** (home, alta, carga masiva, amigos, ajustes, apariencia, admin, categorías y nueva categoría): al pulsar un enlace la pantalla responde al instante en vez de quedarse congelada. **Todo lo que no depende de los datos se pinta ya definitivo y traducido** (pestañas «Mi Lista / De Amigos / Tendencias», títulos, etiquetas y textos de ayuda, opciones fijas de menú, e incluso el catálogo de skins con sus nombres e iconos), y **lo que sí depende se pinta vacío con el mismo estilo, tamaño y posición** que tendrá —campos, casillas, filas—, de modo que al llegar los datos la interfaz no da ningún salto. Se resuelven en cliente, así que en las navegaciones del dock el texto aparece sin esperar al servidor. No se pinta lo que podría desaparecer según permisos (el acceso de admin en ajustes).
- **El botón «Instalar Vibes» ya no desaparece**: siempre ocupa su sitio, con tres estados —instalable, ya instalada, o no compatible con este dispositivo (mensaje nuevo, traducido a los 4 idiomas)—. Antes se ocultaba cuando el navegador no soportaba la instalación y la pantalla daba un salto al terminar de cargar.
- **Fallback de IA más ágil**: se le piden 6 candidatos en vez de 10 (el coste dominante es generar tokens, así que la única espera larga del flujo se acorta).

### Tests
- Cobertura del refactor de búsqueda: similitud (normalización, suelo por contención, umbral), orquestador (paralelismo, proveedores sin key omitidos sin llamada, éxito parcial, tope de 5 proveedores, fallback y cadena de imagen), adaptador de iTunes y **test de consistencia código↔BD** que falla si el registro de proveedores y el catálogo de la migración se desincronizan.
- **Stack de tests** (Vitest + Testing Library, `npm test`): primer arnés automatizado del proyecto. 26 tests de regresión/smoke que blindan las 4 features de la 1.5.0: manifest PWA por skin, helpers de skins, adaptadores TMDB/Steam (póster/carátula, con `fetch` mockeado), vista compacta ↔ ampliada de la tarjeta y wizard de carga masiva (parseo de títulos + flujo de elección/creación/omisión). Extraído `parseTitles` a `src/lib/bulk.ts` para poder testearlo aislado.

## [1.4.4] — 2026-07-03

Hotfix solo de BD (rama `hotfix/1.4.4`), sin redeploy de la app.

### Fixed
- **Correos de amistad y personalización del OTP en prod**: `service_role` no tenía `GRANT` sobre `public.users` en producción (divergencia con local, donde los privilegios por defecto de la plataforma sí existen). El cliente admin fallaba con `42501 permission denied` (amistades sin correo) y el hook `send-email` caía a los defaults (OTP en inglés/Stick stack aunque el usuario tuviera otra skin/idioma). Migración `20260703130000_service_role_grants.sql`: `GRANT SELECT ON public.users TO service_role` (mínimo necesario). *Verificado en prod: correos de amistad y OTP per-skin/idioma funcionando.*

## [1.4.3] — 2026-07-03

Hotfix del autocompletado y las notificaciones tras el despliegue de la 1.4.2 (rama `hotfix/1.4.3`).

### Fixed
- **El proveedor IA ya no inventa enlaces**: el autocompletado con Haiku genera solo título, descripción y etiquetas (2-5); la URL queda vacía para que la rellene el usuario. De paso se corrige un 400 silencioso de structured outputs (`maxItems` no soportado) que dejaba a la IA sin resultados.
- **Badge del proveedor localizado**: los resultados del autocompletado mostraban el kind interno (`AI`); ahora se traduce por idioma («IA» en es/fr/pt, `New.providerBadge`).
- **Desplegable de categorías**: sin texto de búsqueda ahora muestra el catálogo completo (desplazable) en vez de solo 8.

- **Icono de categoría en el paso 2 del alta**: la cabecera del formulario prefill mostraba siempre unas estrellitas (`Sparkles`); ahora muestra el icono real de la categoría seleccionada (`CategoryIcon`).
- **Diagnóstico de los correos de amistad**: si la lectura con el cliente service-role falla (p. ej. `SUPABASE_SERVICE_ROLE_KEY` inválida en Vercel), ahora queda registrado en los logs; antes se omitía el envío en silencio.

### Added
- **Log de fallos de TMDB** (`[tmdb] search failed: HTTP <status>`) visible en los logs de Vercel: antes un fallo del proveedor se confundía con "sin resultados" y caía a la IA sin dejar rastro.

### Database
- Migración `20260703120000_align_categories_catalog.sql`: alinea el catálogo de categorías de todos los entornos con el documento de diseño (release-1-3-0, 21 categorías). En prod: renombra `Cine` → `Película` (conservando sus recomendaciones), crea `Show` y `Zona de acampada`, vincula TMDB a cine/series/documental (causa raíz de que el autocompletado TMDB no funcionara: el seed asignaba por nombre exacto y `Película` no existía) y reordena proveedores (específicos primero, IA como fallback). No elimina categorías extra (`Canción` la eliminó el admin a mano en prod antes de migrar).

### Config
- **Send Email Hook habilitado en prod** (panel + `SEND_EMAIL_HOOK_SECRET`): el OTP llega con la skin e idioma del usuario. `SUPABASE_SERVICE_ROLE_KEY` renovada en Vercel (sospechosa de los correos de amistad ausentes).
- **Tooling**: CLI de Supabase fijada como devDependency (`supabase@2.109.0`) y actualización semver-compatible de dependencias (`@supabase/supabase-js` 2.110, `next-intl` 4.13, `lucide-react` 1.23, `tailwindcss` 4.3.2, `@anthropic-ai/sdk` 0.104.2, types).

## [1.4.2] — 2026-07-02

Hotfix de las pruebas en producción de la 1.4.0 (rama `hotfix/1.4.2`).

### Fixed
- **Autocompletado externo (TMDB/Steam/IA)** no devolvía resultados: faltaba sembrar `category_providers` (migración `20260616120000_seed_category_providers.sql`, idempotente) y la `TMDB_API_KEY`.
- **Correo de bienvenida en skin PICO-8 pop**: la fuente monospace se definía con comillas dobles y rompía el atributo `style="…"` (anulando `text-decoration`, color y fuente); el botón CTA no seguía la skin. Corregido (comillas simples + `btnRadius` por skin).
- **Logo del correo OTP** (Stick stack) no cargaba: URL absoluta en vez de `{{ .SiteURL }}`.
- **Correos de nueva amistad** no llegaban en prod: requieren `SUPABASE_SERVICE_ROLE_KEY` (debe configurarse en Vercel). El código falla de forma segura.

### Changed
- **OTP a 8 dígitos** (`otp_length`, `maxLength` en formularios, i18n).
- **Rate limits** de OTP: `max_frequency=60s`, `email_sent=10/h`, `token_verifications=30` (anti-spam y anti-fuerza bruta).

### Added
- **Send Email Hook** (`supabase/functions/send-email`): OTP renderizado en la skin e idioma del usuario, enviado por Resend. **Deshabilitado** por defecto; verificado en local (skin, idioma, logo y validación del código OK); pendiente de desplegar la función y habilitar el hook + secreto en el panel de prod.

## [1.4.1] — 2026-06-16

Hotfix puntual sobre `main` (tag `v1.4.1`). *(Entrada reconstruida desde git al cerrar la serie 1.4.x.)*

### Fixed
- **Falso "usuario no disponible" en el signup**: la comprobación previa de username (`username_available`, 1.3.1) bloqueaba el alta cuando la RPC fallaba (`null` interpretado como "ocupado"). Ahora solo bloquea un `false` explícito; ante error, el trigger `handle_new_user` sigue siendo el gate final.

## [1.4.0] — 2026-06-15

### Changed
- **Acceso sin contraseñas (Email OTP).** Login y signup pasan a un flujo de dos pasos con **código de un solo uso de 6 dígitos** enviado al correo (caduca en 1h), que además **valida la propiedad del email**. El alta sigue siendo invite-only. Nueva pantalla `/welcome` para elegir skin tras verificar el correo.
- **Sesiones de larga duración:** dejan de caducar (sin time-box ni inactivity timeout) para no obligar a copiar el código con frecuencia.
- **Skin por defecto = Stick stack** (`neobrutalism`) en vez de aleatoria, cuando no hay preferencia en BD ni en localStorage.
- **Correos corporativos por skin:** la plantilla de email se parametriza por skin (`src/lib/email/palettes.ts`); bienvenida y nueva amistad se renderizan con la skin activa del destinatario. El OTP de GoTrue usa una plantilla corporativa en la skin por defecto. Remitente en producción: `Vibes <no-reply@vibes.oneman.es>` (Mailpit en desarrollo).
- **Brand-book reescrito** al concepto **camaleón** (app multi-estilo); "La vie en rose" pasa a ser una skin más.

### Removed
- **Contraseñas y todo lo asociado:** pantallas `/forgot` y `/update-password`, callback PKCE `/auth/callback`, plantilla `recovery` y las acciones `requestPasswordReset`/`updatePassword`/login por contraseña.

### Config
- `config.toml`: `[auth.sessions]` sin caducidad; `[auth.email]` con `otp_length=6`, `otp_expiry=3600`; plantillas `magic_link`/`confirmation` → `supabase/templates/otp.html` (muestra `{{ .Token }}`).

## [1.3.1] — 2026-06-15

Hotfix de diagnóstico del alta (rama `hotfix/1.3.1`).

### Added
- **Logging centralizado de errores de Supabase** (`src/lib/supabase/log.ts`, helper `logSupabaseError`): registra `message/code/details/hint/status/name` en los logs de Vercel, aplicado a las llamadas `.rpc()` y mutaciones de auth, friends, categories, recommendations y páginas server. Da visibilidad al detalle de las excepciones de triggers/funciones que antes se tragaban.

### Fixed
- **Diagnóstico del 500 en signup:** comprobación previa de disponibilidad de username (error `usernameTaken` claro en vez del `unexpected_failure` genérico del trigger). *(La causa raíz real resultó ser el envío del correo de confirmación de GoTrue; se aborda al completo en la 1.4.0.)*

### Database
- Migración `20260614120000_signup_diagnostics.sql`: RPC `username_available`.

## [1.3.0] — 2026-06-14

### Added
- **Selector de apariencia (skins):** la app pasa a ser multi-estilo. Cinco skins con nombre comercial y técnico: **Stick stack** (`neobrutalism`), **La vie en rose** (`cyberbotanical`), **Simple man** (`minimal`), **Speciality popcorn** (`flat design`) y **PICO-8 pop** (`pixel art`). Cada skin define paleta, tipografía, radios y bordes vía bloques `[data-skin]` en `globals.css`, con assets de marca propios (`/logo-*`, `/icon-*`). Persistencia en **localStorage** (sobrevive al logout) + preferencia en `users.skin`; script de arranque que fija `data-skin` antes del primer pintado (sin parpadeo). Cuando no hay preferencia, se elige una al azar.
- **Tags de recomendaciones:** nuevo campo de etiquetas (texto libre, máx. 5) en el formulario de creación, con autocompletado por las etiquetas existentes ordenadas por frecuencia de uso. En las fichas aparecen como chips de solo lectura entre valorar y guardar: 2 visibles con elipsis y un chip «…» que abre un popup con todas. Se retira el botón de «más opciones» de la ficha.
- **Multi-idioma automático (en/es/fr/pt):** recomendaciones, categorías y tags se traducen al crear (Claude Haiku, server-side) y se muestran en el idioma del usuario. Sin `ANTHROPIC_API_KEY` o si la traducción falla, se marca `translated=false` y se hace fallback al texto origen. Columnas JSONB `*_i18n` + `translated`.
- **Proveedores por categoría:** catálogo `providers` (TMDB, Steam, IA) + relación `category_providers` (0–3, con orden) que alimentan la búsqueda externa del alta; se intentan por orden y, si fallan, la app sigue sin resultados externos.
- **Alta de recomendación en 2 pasos:** (1) buscador con autocompletado de categoría + título que combina recomendaciones internas similares y resultados externos (TMDB/Steam/IA), top 8 por similitud, selección obligatoria (o "crear desde cero"); existente → a Mi Lista; externa → (2) formulario pre-rellenado y editable que al guardar traduce y crea.
- **Refinos del alta y las tarjetas:** el autocompletado de etiquetas ofrece "crear etiqueta" cuando no hay coincidencia exacta y se despliega hacia arriba; límites de caracteres en título/descripción/URL/etiqueta (formulario + validación servidor); el scoring se muestra en todas las tarjetas; "Mi Lista" se ordena por scoring descendente dejando al final las recomendaciones ya valoradas.
- **`.env.example`** en el repo, documentando las variables de entorno necesarias.

### Changed
- **Sistema de estilos unificado (Dark Glassmorphism):** se elimina la disparidad visual entre pantallas. Nuevas clases reutilizables en `globals.css` siguiendo el `style-guide.md` (§3.D–§3.G):
  - **Botones** con tres variantes únicas: `.btn-primary` (degradado rosa→verde, 50px, glow), `.btn-secondary` (outline 40px) y `.btn-danger` / `.btn-danger-outline` (rojo neón `#ff0055`).
  - **Formularios** (`.field`, `.field-select`, `.checkbox`): inputs/selects/textarea con fondo semi-transparente, borde *muted* y focus con glow; `select` con chevron vectorial propio; checkbox custom 20px verde neón.
  - **Cabeceras internas** (§3.F): `BackButton` como círculo de 40px y título 24px (`.page-header`/`.page-title`).
  - **Listas estructuradas** (§3.G): `.list-row` con fondo `#18181C`, radio 12px, indicador de estado y acciones destructivas. Retirados los estilos `zinc-*` y `dark:` heredados.
- **Panel de administración por pasos:** `/admin` pasa a ser un menú (botonera); la gestión de categorías vive en `/admin/categories`. Navegación: ajustes → admin → categorías.
- **Borrado de categoría con migración:** al eliminar una categoría se pregunta a qué otra migrar sus recomendaciones; la operación es atómica (RPC `admin_delete_category`).
- **Listas con scroll interno** (categorías, amigos y skins): cabecera fija y degradado inferior sobre el dock; el scroll ya no hace desaparecer la cabecera. El alta de categoría deja de ser inline y se abre con el botón **+** en su propia pantalla `/admin/categories/new`.
- **Botonera de ajustes** con la misma estética que la de admin (icono + nombre + chevron).
- **Idioma de interfaz en cada carga:** con sesión se usa el idioma del **perfil**; sin sesión, el del **navegador** (`Accept-Language`). Antes dependía de una cookie potencialmente obsoleta (`src/i18n/request.ts`).
- **Pantalla de creación de cuenta** con la estética de login; **logo a la misma altura** en login, alta e invitación.
- **Rosa-tallo en la pestaña activa** (Home): se recupera la rosa-tallo del diseño original — el subrayado en degradado rosa→verde es el tallo y termina en el capullo (`public/menu-rose.png`), en lugar del emoji 🌹.
- **Logo e icono PWA en formato JPG** (más ligero): las pantallas y los correos usan `/logo.jpg`; el manifest usa `/icon.jpg`. Eliminados `logo.png`, `icon.png` e `icon.svg`.

### Database
- Migración `20260612120000_user_skin.sql`: columna `users.skin` (nullable) con CHECK del catálogo de estilos; grants `select/update(skin)` a `authenticated`.
- Migración `20260613120000_admin_delete_category.sql`: RPC `admin_delete_category(p_category, p_migrate_to)` (`SECURITY DEFINER`, solo admin) que migra recomendaciones de una categoría a otra y la elimina atómicamente.
- Migración `20260613130000_recommendation_tags.sql`: tablas `tags` y `recommendation_tags` (RLS de solo lectura) + RPCs `suggest_tags` y `create_recommendation`.
- Migraciones `20260613140000`–`20260613140300`: columnas i18n (`*_i18n` + `translated`) en `recommendations`/`categories`/`tags`; tablas `providers` + `category_providers` (seed del catálogo); RPCs v2 `create_recommendation` (i18n + tags), `suggest_tags` (con locale) y `find_similar_in_category`.

## [1.2.0] — 2026-06-07

### Added
- **Amistad por enlace de invitación:** cada usuario tiene un enlace personal **reutilizable** (caduca a las 48h, revocable y regenerable). Página `/invite/[token]` con dos caminos: sin sesión → "iniciar sesión o crear cuenta" (preservando el token); con sesión → pantalla de **aceptar** con los nombres invitador → invitado. Compartir con el selector nativo (**Web Share API**) desde la sección Amigos. Al aceptar se crea la amistad **bidireccional**; el alta deja de crearla automáticamente (flujo uniforme: nuevos y existentes pasan por aceptar).
- **Correos informativos en HTML** con la estética de la app (canvas negro, card `#18181C`, borde superior degradado, logo centrado, tipografía y colores del tema):
  - **A. Bienvenida** al completar el alta (botón principal "Entrar a Vibes").
  - **B. Restablecimiento de contraseña** vía plantilla de Supabase Auth (`recovery.html`), preservando el flujo PKCE.
  - **C. Nueva amistad** al aceptar una invitación (botón outline "Ver el feed").
  - A y C se envían vía Resend (Mailpit en local) **localizados por destinatario** (en/es/fr/pt); remitente unificado **Vibes**.
- **Infraestructura de email:** `src/lib/email/template.ts` (layout + primitivas) y `src/lib/email/resend.ts`; cliente service-role `src/lib/supabase/admin.ts` para leer los emails al notificar.

### Changed
- **Fondo a negro puro** (`#000000`) en todo el canvas.
- **Refactors de calidad:** estado derivado en render en lugar de `setState` dentro de efectos (`recommendation-card`, `new-recommendation-form`); detección de PWA *standalone* con `useSyncExternalStore` (`install-prompt-provider`).

### Removed
- **Buscador de usuarios** y RPC `add_friend`. Añadir amigos es **solo** por enlace de invitación. La RLS de `users` deja de exponer perfiles por `is_searchable` (solo fila propia o amigos).

### Security
- **Endurecimiento tras auditoría de caja blanca** (`20260606120000_security_hardening.sql`): corrige un IDOR en `organizar_quedada` (exige que el llamante se incluya y que el resto sean amigos suyos); revoca `execute` de `is_admin(uuid)` a `anon/public`; revoca `execute` de las funciones-trigger (`handle_new_user`, `maintain_affinity`, `maintain_global_score`, `set_updated_at`) por defensa en profundidad; fija `search_path` en `set_updated_at`.
- **Eliminado el admin-semilla por email hardcodeado** del trigger `handle_new_user` (`20260606130000`): era PII en el repo y un riesgo latente; todo alta requiere ya un token de invitación válido, sin excepciones.

### Database
- Migración `20260607120000_friends_invite_flow.sql`:
  - `invitation_tokens.revoked_at` y tokens **reutilizables** (48h); `invite_token_valid` ya no depende de `is_used`.
  - Nuevos RPCs `invite_info`, `accept_invitation` (amistad bidireccional, no consume el token), `ensure_invite`, `regenerate_invite`, `revoke_invite`.
  - `handle_new_user` ya **no** crea la amistad ni consume el token en el alta (la amistad se crea al aceptar).
  - Retirada de `add_friend`; política `users_select` sin `is_searchable`.

### Config
- Configuración para entorno **cloud** (Postgres 17) y exclusión del estado interno del Supabase CLI del repo (`.gitignore`).
- `supabase/config.toml`: `[auth.email.template.recovery]` (asunto + `content_path`) para el correo de reset con estética Vibes.

## [1.1.0] — 2026-06-06

### Branding
- **Rebranding VibeCheck → Vibes** en toda la app (i18n `App.title`, manifest, docs internos).
- **Paleta:** el segundo neón pasa de **cian** (`#00F5D4`) a **verde neón** (`#39FF85`) según el brand book *Cyber-Botanical*. Renombrada la variable `--neon-cyan` → `--neon-green` y todas las clases (`text-neon-green`, `border-neon-green`…).
- **Logo:** en `/login` ahora se muestra el logo rectangular real (`/logo.png`) en vez del título tipográfico gradiente; el icono de la PWA usa la V Foliar cuadrada (`/icon.png`).
- **Eslogan:** "Buenas vibras en tu círculo" (i18n en 4 idiomas) bajo el logo en /login.

### Changed
- **Modelo de interacción desacoplado:** `user_interactions.status` (enum) reemplazado por `saved` (boolean) + `rating` (nullable). Calificar ya no quita de Mi Lista y guardar en Mi Lista ya no borra la calificación. Una fila representa cualquier combinación de ambos; cuando ambos vuelven a vacío, la fila se borra.
- **Feeds "De Amigos" y "Tendencias":** excluyen ahora los items que el usuario tiene en Mi Lista.
- **Tabs sticky:** el fondo ocupa el 100% del ancho de la pantalla y tiene un fade inferior a transparente; al cambiar de pestaña se refresca el orden de la lista (mantiene posiciones solo durante la visita a esa pestaña).
- **Tarjetas:**
  - Cápsula de calificación con **fondo transparente** y borde sincronizado en color y opacidad con el icono (sin `.glass`).
  - Opacidad de los botones apagados: **0.2** (antes 0.3); encendidos siguen en 0.7.
  - `+/−` y calificación ahora son **independientes**: cada uno modifica solo su campo.
  - El botón `⋯` se confirma como decorativo (reservado para futuras opciones) — ya no ejecuta ninguna acción.
- **Botón "Volver":** color base blanco y siempre encendido. **Eliminado** de las páginas accesibles desde el dock (Añadir, Quedada, Perfil); se mantiene en Amigos y Admin.
- **Pestañas (Home):** `sticky top-0` con fondo opaco; permanecen visibles al hacer scroll.
- **Orden estable de listas:** durante la visita las recomendaciones conservan su posición; los cambios (puntuar, guardar, etc.) ya no las reordenan en pantalla. Los nuevos items entran al final.
- **Botón "Volver":** ahora es un icono `ArrowLeft` dentro de un círculo cian neón (componente `BackButton`), coherente con el "⋯" de las tarjetas. Aplicado en /friends, /admin, /quedada y /new.
- **Botón "⋯" de las tarjetas:** desacoplado de cualquier acción (queda reservado para futuras opciones); aria-label "más opciones".
- **Estados visuales de los botones de la tarjeta:** sistema de opacidades 0.3 (apagado) / 0.7 (encendido) usando `border-current`.
  - `+/−`: blanco; encendido cuando el ítem está en Mi Lista (icono `−`).
  - Calificación (colapsada): blanco; encendida cuando hay valoración. Rating 2 mantiene la excepción de **relleno rosa** en el corazón.
  - `⋯`: cian, siempre encendido.
- **Ajustes:** auto-save al cambiar idioma o el flag de afinidad; se eliminan los botones "Guardar" y "Volver".
- **Dock inferior:** ahora tiene un fondo negro con fade superior (gradiente vertical `var(--background)` → transparente, alto 143px — 15px más arriba que antes), para que las tarjetas no se mezclen al hacer scroll.
- **/friends → "Volver":** ahora vuelve a **/settings (Perfil)** en lugar de a la Home (la sección de amigos cuelga del perfil).
- **Tarjetas de recomendación:**
  - Alto **fijo a 154px** en todas las tarjetas (independiente del contenido).
  - El subtítulo se trunca a **2 líneas** con elipsis (`line-clamp-2`); el título a 1 línea con `truncate`.
  - La cápsula de calificación pasa a **36×36 px** comprimida y **118×36 px** desplegada (mismo alto que los botones `+/−` y `⋯`), con transición suave de `width`.

### Added
- **19 categorías nuevas** sembradas en `categories`: Serie de televisión, Documental, Podcast, Videojuego, Juego VR, Juego de mesa, Teatro, Monólogo, Expo, Museo, Grupo de música, Canción, Festival, Lugar emblemático, Ruta de senderismo, Ruta de ciclismo, Vía ferrata, Zona de escalada, Zona de baño. Cada una con su icono Lucide y color.
- **Whitelist Lucide ampliada** (`CategoryIcon`): añadidos `Bike`, `Castle`, `Drama`, `Footprints`, `Glasses`, `Guitar`, `Image`, `Landmark`, `Mic`, `MountainSnow`, `PartyPopper`, `Podcast`, `Waves`.
- **Crear recomendación auto-saved:** al crear, la nueva rec se añade automáticamente a Mi Lista del creador.
- **PWA instalable:** `public/manifest.webmanifest`, `public/icon.svg` y service worker mínimo `public/sw.js`. El layout enlaza el manifest. Provider cliente `InstallPromptProvider` que captura `beforeinstallprompt` y expone `useInstallPrompt()`.
- **Botones de instalación:**
  - En `/login`, **`InstallButtonFloating`** en la esquina inferior derecha, blanco apagado (opacity 0.2). Solo se muestra si el navegador la considera instalable y no está ya instalada.
  - En `/settings`, **`InstallButtonInline`** con texto al lado: "Instalar Vibes" (blanco encendido) si no está instalada; "Ya tienes buenas Vibes" (blanco apagado, deshabilitado) si ya está instalada.
- **Usuarios de prueba adicionales:** Carla, Diego y Elena (Password123) creados vía Admin API. Solo son amigos de Marcos (NO de Ana). Cada uno con 2 recomendaciones creadas, items en Mi Lista y calificaciones cruzadas para enriquecer Tendencias.
- **Botón de calificación colapsable:** un solo botón en la cápsula. Si no hay calificación muestra `Check` y al pulsar despliega los tres iconos (👎/👍/❤️); al elegir uno se contrae mostrando el icono elegido. Si ya hay calificación, al pulsar se elimina (vuelve a `Check`). Si el usuario abre el desplegable y clica fuera, se contrae sin cambios.
- **Sistema de iconos lineales con `lucide-react`** (sucesor de Feather), coherente con la guía UX 1.1.0 (cyberpunk/synthwave + glassmorphism). Reemplazados todos los emojis (categoría, rating 👎/👍/❤️, `+/−/⋯`, dock) por iconos Lucide tintados con `currentColor` (rosa o cian).
- Componente `CategoryIcon` con whitelist tree-shakeable (`Clapperboard`, `Dices`, `BookOpen`, `Film`, `Gamepad2`, `Music`, `Tv`, `Utensils`, …); el admin elige el nombre desde un `<datalist>`.
- Rediseño UX completo (cyberpunk/synthwave + glassmorphism): nueva paleta neón, tarjetas con borde degradado y glow, cápsula de rating, botones circulares `+/−` y `⋯`, pestañas con subrayado degradado + 🌹.
- Dock inferior flotante con 5 items (Mi lista, Suerte, **Añadir** central, Quedada, Perfil) y glassmorphism (`src/components/bottom-dock.tsx`).
- Página de login: título "Vibes" grande centrado con degradado neón.
- Detección automática del idioma de interfaz desde `Accept-Language` del navegador para usuarios no identificados y al registrarse (`src/i18n/request.ts` + persistencia en el trigger `handle_new_user`).
- Edición manual de la afinidad con cada amigo (`updateAffinity` + input numérico 0–10 en `FriendsManager`).
- URL opcional en las recomendaciones; al clicar el título de una tarjeta se abre en pestaña nueva (`target="_blank" rel="noopener noreferrer"`).
- Guía de estilos y design tokens en `documentation/ui/` (`design-tokens.json`, `style-guide.mdx`, `preview.tsx`, `preview.png`).

### Changed
- Header de la Home eliminado: amigos, admin y logout se movieron a la pantalla **Perfil** (`/settings`); la navegación principal pasa al dock.
- Login: se eliminó el enlace a `/signup`.
- Botones/inputs migrados al tema oscuro con bordes `white/15` y foco `neon.cyan`.

### Database
- Migración `20260527120600_signup_language.sql`: el trigger `handle_new_user` ahora respeta `raw_user_meta_data.language` (en/es/fr/pt) si llega del cliente.
- Migración `20260527120700_recommendation_url.sql`: nueva columna `recommendations.url` con check `^https?://` y grants `select(url) / insert(url)` a `authenticated`.
- Seed: `categories.icon` migrado a nombres Lucide (Cine→`Clapperboard`, Juegos→`Dices`).

## [1.0.0] — 2026-05-27

Primera versión funcional (MVP).

### Added
- Esquema de BD (6 tablas, 3 enums, índices) + extensión `pg_trgm`.
- Row Level Security + grants por columna (oculta `email`, `created_by`, bloquea `role`).
- Triggers de negocio (`SECURITY DEFINER`): alta invite-only, afinidad asimétrica con control de deriva, `global_score` cacheado.
- RPCs `add_friend`, `remove_friend`, `organizar_quedada`, `find_similar_recommendations`, `invite_token_valid`, `is_admin`.
- Auth completa: login (errores opacos), signup invite-only con validación previa del token, logout, recuperación de contraseña vía Mailpit en local.
- Home con árbol de decisión y 3 pestañas (Mi Lista / De Amigos / Tendencias).
- Tarjetas interactivas: guardar / valorar (−1/1/2) / quitar.
- Crear recomendación con deduplicación difusa (`pg_trgm`).
- Gestión de amigos: buscar, añadir, eliminar (bidireccional).
- Preferencias: idioma de interfaz (en/es/fr/pt) + scoring por afinidad (query-time math).
- Admin de categorías (solo admin), con gating en página.
- Organizar Quedada (consenso grupal vía RPC).
- i18n con `next-intl` sin routing por URL (cookie `locale` sincronizada con perfil).
