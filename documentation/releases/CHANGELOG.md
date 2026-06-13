# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/) y versionado [SemVer](https://semver.org/).

## [Unreleased] — versión 1.2.0 (en preparación)

### Added
- **Amistad por enlace de invitación:** cada usuario tiene un enlace personal **reutilizable** (caduca a las 48h, revocable y regenerable). Página `/invite/[token]` con dos caminos: sin sesión → "iniciar sesión o crear cuenta" (preservando el token); con sesión → pantalla de **aceptar** con los nombres invitador → invitado. Compartir con el selector nativo (**Web Share API**) desde la sección Amigos.
- **Correos informativos en HTML** con la estética de la app (canvas negro, card `#18181C`, borde superior degradado, logo centrado arriba, tipografía y colores del tema):
  - **A. Bienvenida** al completar el alta (botón principal "Entrar a Vibes").
  - **B. Restablecimiento de contraseña** vía plantilla de Supabase Auth (`recovery.html`), preservando el flujo PKCE.
  - **C. Nueva amistad** al aceptar una invitación (botón outline "Ver el feed").
  - A y C se envían vía Resend (Mailpit en local) **localizados por destinatario** (en/es/fr/pt); remitente unificado **Vibes**.
- **Infraestructura de email:** `src/lib/email/template.ts` (layout + primitivas) y `src/lib/email/resend.ts`; cliente service-role `src/lib/supabase/admin.ts` para leer los emails de los usuarios al notificar.

### Added
- **Tags de recomendaciones:** nuevo campo de etiquetas (texto libre, máx. 5) en el formulario de creación, con autocompletado basado en las etiquetas existentes ordenadas por frecuencia de uso. En las fichas, las etiquetas aparecen como chips de solo lectura entre los botones de valorar y guardar: se muestran 2 (con ancho máximo y elipsis) y, si hay más, un chip «…» que abre un popup con todas. Se retira el botón de «más opciones» de la ficha.

### Changed
- **Panel de administración por pasos:** `/admin` pasa a ser un menú (botonera) de opciones de gestión; la gestión de categorías vive en `/admin/categories`. Navegación: ajustes → admin → categorías.
- **Lista de categorías con scroll interno** (mismo patrón que Amigos): cabecera fija y degradado inferior sobre el dock. El alta deja de ser un formulario inline y se abre con el botón **+** de la cabecera, en su propia pantalla `/admin/categories/new`.
- **Borrado de categoría con migración:** al eliminar una categoría se pregunta a qué otra categoría migrar sus recomendaciones; la operación es atómica (RPC `admin_delete_category`).
- **Idioma de interfaz en cada carga:** con sesión se usa el idioma del **perfil** del usuario; sin sesión, el del **navegador** (`Accept-Language`). Antes dependía de una cookie potencialmente obsoleta (`src/i18n/request.ts`).
- **Pantalla de creación de cuenta:** misma estética que login (logo + eslogan + inputs/botones neón).
- **Logo a la misma altura** en login, alta e invitación.
- **Lista de amigos con scroll interno:** la cabecera, el botón Volver y el componente de invitación quedan fijos; solo desplaza la lista.
- **Refactors de calidad:** estado derivado en render en lugar de `setState` dentro de efectos (`recommendation-card`, `new-recommendation-form`); detección de PWA *standalone* con `useSyncExternalStore` (`install-prompt-provider`).
- **Sistema de estilos unificado (Dark Glassmorphism):** se elimina la disparidad visual entre pantallas. Nuevas clases reutilizables en `globals.css` siguiendo el `style-guide.md` (§3.D–§3.G):
  - **Botones** con tres variantes únicas: `.btn-primary` (degradado rosa→verde, 50px, glow), `.btn-secondary` (outline 40px) y `.btn-danger` / `.btn-danger-outline` (rojo neón `#ff0055`).
  - **Formularios** (`.field`, `.field-select`, `.checkbox`): inputs/selects/textarea con fondo semi-transparente, borde *muted* y focus con glow; `select` con chevron vectorial propio (sin flecha nativa); checkbox custom 20px verde neón con micro-resplandor.
  - **Cabeceras internas** (§3.F): `BackButton` como círculo de 40px (fondo surface + borde muted) y título 24px (`.page-header`/`.page-title`).
  - **Listas estructuradas** (§3.G): `.list-row` con fondo `#18181C`, radio 12px, indicador de estado a la izquierda y acciones destructivas a la derecha.
  - Pantallas migradas: login, signup, forgot, update-password, new, settings, admin, quedada, friends (e invite-link / accept-invitation). Retirados los estilos `zinc-*` y `dark:` heredados.
- **Rosa de la pestaña activa** (Home): se recupera la rosa-tallo de la propuesta inicial de diseño (`documentation/ui/preview.jpg`) — el subrayado en degradado rosa→verde es el tallo y termina en el capullo a la derecha (`public/menu-rose.png`), en lugar del emoji 🌹.
- **Logo e icono PWA en formato JPG** (más ligero): las pantallas (login, alta, invitación) y los correos usan `/logo.jpg`; el manifest usa `/icon.jpg` (`image/jpeg`). Eliminados `logo.png`, `icon.png` e `icon.svg`.

### Removed
- **Buscador de usuarios** y RPC `add_friend`. Añadir amigos es **solo** por enlace de invitación. La RLS de `users` deja de exponer perfiles por `is_searchable` (solo fila propia o amigos).

### Database
- Migración `20260607120000_friends_invite_flow.sql`:
  - `invitation_tokens.revoked_at` y tokens **reutilizables** (48h); `invite_token_valid` ya no depende de `is_used`.
  - Nuevos RPCs `invite_info`, `accept_invitation` (amistad bidireccional, no consume el token), `ensure_invite`, `regenerate_invite`, `revoke_invite`.
  - `handle_new_user` ya **no** crea la amistad ni consume el token en el alta (la amistad se crea al aceptar).
  - Retirada de `add_friend`; política `users_select` sin `is_searchable`.
- Migración `20260613120000_admin_delete_category.sql`: RPC `admin_delete_category(p_category, p_migrate_to)` (`SECURITY DEFINER`, solo admin) que migra las recomendaciones de una categoría a otra y la elimina de forma atómica.
- Migración `20260613130000_recommendation_tags.sql`: tablas `tags` y `recommendation_tags` (catálogo compartido, RLS de solo lectura), más RPCs `suggest_tags` (autocompletado por uso) y `create_recommendation` (alta + enlazado de hasta 5 tags, `SECURITY DEFINER`).

### Config
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
