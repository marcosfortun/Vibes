# README

## Qué es Vibes

**Vibes** es una *web-app* (PWA instalable) para que un grupo cerrado de amigos centralice y se recomiende ocio: pelis, series, juegos, rutas, conciertos, sitios… El sistema deduplica el catálogo, protege la privacidad del grupo y **personaliza los feeds con un algoritmo de afinidad asimétrica** entre amigos.

Es un proyecto personal *indie* con coste de infraestructura cero (tiers gratuitos de Supabase + Vercel) y una identidad visual propia: estilo **Cyber-Botanical** (synthwave neón + toques orgánicos). Ver [`documentation/pd-brand-book.md`](documentation/pd-brand-book.md).

## Características

- **Registro invite-only**: solo se entra con un token de invitación.
- **Home con varias listas**: Mi Lista → De Amigos → Tendencias.
- **Scoring por afinidad**: la afinidad A→B se ajusta cuando coinciden calificaciones.
- **Organizar quedada**: cruza las listas de los asistentes y devuelve un top 3.
- **Categorías**: especialización y filtrado de las recomendaciones según su categoría.
- **Multi-idoma**: soporte para varios idiomas (es, en, pt, fr).
- **PWA** instalable en escritorio/móvil.

> Diseño funcional completo en [`documentation/pd-product-design.md`](documentation/pd-product-design.md)
> y seguridad (RLS/RPC) en [`documentation/pd-security-design.md`](documentation/pd-security-design.md).

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components + Server Actions, Turbopack) |
| Lenguaje | TypeScript, React 19 |
| Estilos | Tailwind CSS v4 + design tokens propios |
| Iconos | lucide-react |
| Backend / BD / Auth | Supabase (PostgreSQL + Auth + RLS), `pg_trgm` |
| i18n | next-intl (sin routing por URL; locale en cookie) |
| Estado cliente | Zustand / React Context |
| Despliegue objetivo | Vercel + Supabase Cloud |

## Requisitos previos

- **Node.js** ≥ 20.9
- **Docker Desktop** (para el stack local de Supabase)
- **Supabase CLI** (`brew install supabase/tap/supabase`)

## Puesta en marcha (local)

### Opción rápida — todo en uno

```bash
./scripts/up.sh
```

El script arranca Docker si está apagado, levanta Supabase si no responde y lanza el dev server. Luego abre **http://localhost:3000**.

### Puertos del stack local

| Servicio | URL |
| --- | --- |
| App (Next.js) | http://localhost:3000 |
| API Supabase | http://127.0.0.1:54321 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Mailpit (correos de prueba) | http://127.0.0.1:54324 |

> Studio, Storage, Analytics y Realtime están **desactivados** en `supabase/config.toml`
> (health checks inestables en local; no se usan en el MVP).

## Variables de entorno

`.env.local` (no se commitea) con las claves del Supabase local:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key que imprime "supabase start">
```

## Base de datos y migraciones

Las migraciones viven en [`supabase/migrations/`](supabase/migrations) y se aplican en
orden por nombre. Sobre una base limpia las aplica `supabase start` / `supabase db reset`.

> ⚠️ **Importante en local:** si añades una migración nueva, **no se aplica sola** sobre
> el volumen existente. Aplícala a mano:
> ```bash
> docker exec -i supabase_db_vibecheck psql -U postgres < supabase/migrations/<archivo>.sql
> ```
> `supabase db reset` la aplicaría también, pero **borra todos los datos**.

Tras cambios de esquema, regenera los tipos TypeScript:

```bash
supabase gen types typescript --local --schema public > src/lib/database.types.ts
```

### Modelo de datos

Las tablas principales son `users`, `categories`, `recommendations`, `user_interactions` (saved + rating),
`friendships` (afinidad dirigida).

La lógica sensible (alta
invite-only, afinidad, `global_score`, organizar quedada, dedup) vive en triggers y RPCs
`SECURITY DEFINER`.

Esquema visual en [`documentation/pd-schema.drawio.png`](documentation/pd-schema.drawio.png).

## Scripts de npm

| Comando | Acción |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |

## Estructura del proyecto

```txt
Vibes/
├── src/
│   ├── app/                        # Rutas (Next.js App Router)
│   │   ├── page.tsx                # Home: árbol de decisión + 3 pestañas
│   │   ├── layout.tsx              # Layout raíz: i18n, dock, provider PWA
│   │   ├── globals.css             # Tema (tokens neón, glassmorphism, utilidades)
│   │   ├── login/                  # Login (page + login-form)
│   │   ├── signup/                 # Alta invite-only (page + signup-form)
│   │   ├── forgot/                 # Solicitar reset de contraseña
│   │   ├── update-password/        # Fijar nueva contraseña (sesión recovery)
│   │   ├── auth/callback/route.ts  # Intercambio de code → sesión (recovery)
│   │   ├── new/                    # Crear recomendación (+ dedup pg_trgm en vivo)
│   │   ├── friends/                # Gestión de amigos
│   │   ├── quedada/                # Organizar Quedada (consenso grupal)
│   │   ├── settings/               # Perfil/Ajustes (idioma, afinidad, logout, admin)
│   │   └── admin/                  # Admin de categorías (gated por rol)
│   ├── components/                 # Componentes de UI (cliente)
│   │   ├── home-tabs.tsx           # Pestañas Mi Lista / De Amigos / Tendencias
│   │   ├── recommendation-card.tsx # Tarjeta (rating colapsable, guardar, etc.)
│   │   ├── bottom-dock.tsx         # Dock inferior flotante (glassmorphism)
│   │   ├── category-icon.tsx       # Mapa nombre → icono Lucide (whitelist)
│   │   ├── back-button.tsx         # Botón "volver" circular
│   │   ├── friends-manager.tsx     # Buscar/añadir/eliminar amigos + afinidad
│   │   ├── quedada-planner.tsx     # Selección de asistentes + Top 3
│   │   ├── new-recommendation-form.tsx
│   │   ├── admin-categories.tsx
│   │   ├── settings-form.tsx       # Preferencias con auto-save
│   │   ├── install-button.tsx      # Botones de instalación PWA (login/ajustes)
│   │   └── install-prompt-provider.tsx  # Captura beforeinstallprompt + registra SW
│   ├── lib/
│   │   ├── actions/                # Server Actions
│   │   │   ├── auth.ts             # login, signup, logout, reset/update password
│   │   │   ├── recommendations.ts  # crear recomendación (auto-saved)
│   │   │   ├── interactions.ts     # setSaved / setRating
│   │   │   ├── friends.ts          # add/remove friend, updateAffinity
│   │   │   ├── categories.ts       # crear/eliminar categoría (admin)
│   │   │   └── preferences.ts      # idioma + scoring por afinidad
│   │   ├── supabase/
│   │   │   ├── client.ts           # Cliente browser (@supabase/ssr)
│   │   │   ├── server.ts           # Cliente server (cookies async)
│   │   │   └── proxy.ts            # Refresco de sesión + protección de rutas
│   │   └── database.types.ts       # Tipos generados de la BD
│   ├── i18n/
│   │   ├── config.ts               # Locales soportados + helpers
│   │   └── request.ts              # Resolución de locale (cookie → navegador)
│   └── proxy.ts                    # Middleware de Next 16 (en src/, no en raíz)
│
├── supabase/
│   ├── config.toml                 # Config del stack local
│   └── migrations/                 # Migraciones SQL (orden por timestamp)
│
├── messages/                       # Traducciones i18n (en, es, fr, pt)
│
├── public/                         # Estáticos
│   ├── logo.png                    # Logo rectangular (login)
│   ├── icon.png / icon.svg         # Iconos de la PWA
│   ├── manifest.webmanifest        # Manifest PWA
│   └── sw.js                       # Service worker mínimo
│
├── documentation/                  # Fuente de verdad de diseño y marca
│   ├── pd-product-design.md        # Diseño de producto (fuente de verdad)
│   ├── pd-security-design.md       # RLS, RPC, grants
│   ├── pd-brand-book.md            # Manual de marca (Cyber-Botanical)
│   ├── pd-arq.drawio.png           # Diagrama de arquitectura
│   ├── pd-schema.drawio.png        # Diagrama del esquema de BD
│   ├── logo/                       # Logo + variantes exploradas
│   ├── wireframes/                 # Bocetos por pantalla (draw.io PNG)
│   ├── ui/                         # Design tokens, guía de estilos y preview
│   └── releases/                   # CHANGELOG global + carpeta por versión
│
├── scripts/
│   └── up.sh                       # Arranca Docker + Supabase + dev en un comando
│
└── AGENTS.md / CLAUDE.md           # Reglas para agentes de IA en este repo
```
