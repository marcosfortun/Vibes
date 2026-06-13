# Vibes — Diseño de Seguridad (RLS, RPC y huecos resueltos)

Documento compañero de `product-design.md` (fuente única de verdad). Aquí se concretan las
políticas de Row Level Security, la lógica de servidor (`SECURITY DEFINER`) y las decisiones
de alcance que el diseño de producto dejaba abiertas. Entorno: Supabase **CLI local + migraciones
versionadas** (Docker), sin tocar cloud hasta el despliegue.

## Principios

- Roles Supabase: `anon` (sin sesión) y `authenticated`. `auth.uid()` = id del usuario.
  `public.users.id` = `auth.users.id`.
- RLS controla **filas**; la privacidad por **columna** (catálogo neutro, email) se resuelve con
  `GRANT`/`REVOKE` a nivel de columna.
- Helper `is_admin()` como función `SECURITY DEFINER` que lee `users.role` (evita recursión RLS
  sobre `users`).
- Toda operación que cruza fronteras de privacidad va por **RPC `SECURITY DEFINER`** controlado
  (alta por invitación, add/remove friend, organizar quedada).

## Políticas por tabla

### `users`
- **SELECT:** `auth.uid() = id` OR `is_searchable = true` OR existe amistad `auth.uid() → id`.
- **Columna `email`:** `REVOKE SELECT(email)` a `authenticated` (el email propio vive en la sesión
  `auth.users`).
- **Columna `role`:** `REVOKE UPDATE(role)` a `authenticated` (sin auto-escalada).
- **UPDATE:** solo fila propia (`auth.uid() = id`).
- **INSERT/DELETE:** sin política de cliente; la fila se crea por trigger de alta (§ Alta).

### `categories`
- **SELECT:** todos los `authenticated`.
- **INSERT/UPDATE/DELETE:** solo `is_admin()`. El borrado real se hace vía RPC
  `admin_delete_category` (migra antes las recomendaciones; ver §Lógica de servidor).

### `recommendations` (catálogo neutro, **append-only**)
- **SELECT:** todos los `authenticated`. `REVOKE SELECT(created_by)` → autoría nunca visible.
- **INSERT:** `authenticated` con `WITH CHECK (created_by = auth.uid())`. Deduplicación pg_trgm
  es app-side (no RLS).
- **UPDATE/DELETE:** ninguna política de cliente. `global_score` lo mantiene el trigger
  (`SECURITY DEFINER`). La recategorización masiva al borrar una categoría va por el RPC
  `admin_delete_category` (`SECURITY DEFINER`), única vía que reasigna `category_id`.

### `user_interactions`
- **SELECT:** `user_id = auth.uid()` OR (`status = 'completed'` AND existe amistad
  `auth.uid() → user_id`). Los `saved` de amigos NO se exponen aquí (solo dentro del RPC de quedada).
- **INSERT/UPDATE/DELETE:** `user_id = auth.uid()`. CHECK `rating ∈ {-1,1,2}` y triggers de
  afinidad/`global_score`.

### `friendships` (asimétrica por dirección)
- **SELECT / UPDATE:** `user_id = auth.uid()` (afinidades salientes; editables, CHECK 0–10).
- **INSERT/DELETE:** sin política de cliente. Se gestionan vía RPC `add_friend` / `remove_friend`
  y el trigger de alta.

### `invitation_tokens`
- **SELECT:** `generated_by = auth.uid()`. La validación en signup (anon) va por RPC.
- **INSERT:** `authenticated` con `WITH CHECK (generated_by = auth.uid())`.
- **UPDATE (`is_used`):** solo dentro del RPC de alta.
- **Token:** UUID. Expiración por defecto **7 días**.

## Lógica de servidor (`SECURITY DEFINER`)

### Alta invite-only — trigger `AFTER INSERT ON auth.users`
`signUp()` pasa `options.data.invite_token`. El trigger:
1. Lee el token de `raw_user_meta_data`; valida `is_used = false` AND `expires_at > now()`.
   Si falla → `RAISE EXCEPTION` (alta atómica revertida).
2. Crea `public.users` (role `user`).
3. Marca el token `is_used = true`.
4. Inserta amistad **bidireccional** con `generated_by`, afinidad 5.0 en ambas direcciones.

### `add_friend(target_id)` — amistad manual desde el buscador
- Solo sobre usuarios visibles para el llamante (`is_searchable = true` o ya relacionados).
- Inserta amistad **bidireccional** con afinidad 5.0 (idempotente: no duplica si ya existe).

### `remove_friend(target_id)` — eliminar amistad
- Borra **ambas** direcciones (`(uid,target)` y `(target,uid)`) para mantener coherencia de feeds.

### `organizar_quedada(asistentes[])` — consenso grupal
- Lee `saved` de los asistentes (salta RLS), excluye lo `completed` por cualquiera de ellos,
  calcula `SG = media de Scoring Personalizado` y devuelve Top 3.

### `admin_delete_category(p_category, p_migrate_to)` — borrado de categoría
- Solo `is_admin()` (si no, lanza excepción). Operación atómica: reasigna las
  recomendaciones de `p_category` a `p_migrate_to` (si se indica) y borra la categoría.
- Necesario porque `recommendations.category_id` es `NOT NULL` y el cliente no tiene
  `UPDATE` sobre `recommendations`; salta RLS para migrar recs de cualquier autor.

## Triggers de mantenimiento (resumen; fórmulas en `product-design.md`)
- Afinidad asimétrica sobre `user_interactions` (INSERT/UPDATE/DELETE) con control de deriva.
- `global_score` cacheado sobre `recommendations` (suma/diferencia/resta de ratings `completed`).

## Definiciones de feed
- **Tendencias globales:** `recommendations ORDER BY global_score DESC`.
- **Recomendaciones de amigos:** ítems `completed` por al menos un amigo AND sin fila propia en
  `user_interactions` (ni `saved` ni `completed`).
- **Árbol Home:** 1) ¿tengo `saved`? → Mi Lista; 2) ¿hay feed de amigos? → De Amigos; 3) → Tendencias.

## Decisiones de alcance MVP (huecos resueltos)
1. Recomendaciones: **append-only** (sin editar/borrar por usuario).
2. Add-friend manual: **sí**, vía `add_friend`, afinidad inicial 5.0.
3. Unfriend: **sí**, vía `remove_friend`, borra ambas direcciones.
4. Feed amigos: `completed` por amigos, excluyendo ítems con interacción propia.
5. i18n: **next-intl** (en default; es, fr, pt).
6. Token: UUID, expiración 7 días.
