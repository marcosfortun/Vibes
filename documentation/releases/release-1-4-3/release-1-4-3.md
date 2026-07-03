# Hotfix release 1.4.3 — Autocompletado y notificaciones tras las pruebas de la 1.4.2

Hotfix sobre la rama `hotfix/1.4.3` (tag `v1.4.3`, 2026-07-03). Recoge los fallos
encontrados al probar la 1.4.2 en producción y las correcciones aplicadas.

## Correcciones

1. **El autocompletado TMDB no funcionaba en prod (Steam e IA sí).** Causa raíz
   confirmada consultando la BD de producción: el catálogo de categorías de prod
   se creó a mano y se desvió del documento de diseño (release-1-3-0, 21
   categorías): tenía `Cine` en vez de `Película` y le faltaban `Show` y `Zona
   de acampada`. Como el seed de `category_providers` (1.4.2) asignaba por nombre
   exacto, TMDB nunca se vinculó a cine y el fallback de IA respondía siempre.
   Migración `20260703120000_align_categories_catalog.sql` (idempotente, no-op en
   entornos alineados): renombra `Cine` → `Película` conservando el id (sus
   recomendaciones no se tocan), crea las categorías que falten con los
   iconos/colores del seed local, vincula TMDB/Steam según el documento y
   renumera posiciones (proveedores específicos primero, IA como fallback).
   La categoría extra `Canción` (fuera del documento) la eliminó el admin a mano
   antes de migrar. *Verificado en prod: 21 categorías exactas y TMDB en
   posición 1 en cine/series/documental.*

2. **La IA inventaba enlaces (IMDB incorrectos).** El proveedor Haiku ya no
   genera `url`: solo título, descripción y **etiquetas (2-5, nuevas)**; la URL
   queda vacía para que la rellene el usuario. De regalo, al implementar esto se
   detectó y corrigió un **400 silencioso** de structured outputs: `maxItems` no
   está soportado en el JSON Schema y dejaba a la IA sin resultados (el límite se
   aplica ahora en código). *Verificado en local: candidato IA con tags y sin URL.*

3. **Badge del proveedor sin localizar.** Los resultados externos mostraban el
   `kind` interno (`AI` en cualquier idioma). Nueva clave i18n
   `New.providerBadge` en los 4 locales: «IA» (es/fr/pt), «AI» (en), TMDB/Steam
   con su marca. *Verificado en local con usuarias en es y en.*

4. **El desplegable de categorías no mostraba el catálogo completo.** Sin texto
   de búsqueda solo aparecían 8; ahora se listan todas (la lista es desplazable)
   y con texto se mantiene el top 8. *Verificado: 21 categorías visibles.*

5. **Icono incorrecto en el paso 2 del alta.** La cabecera del formulario
   prefill mostraba siempre `Sparkles` (hardcodeado); ahora `/new` incluye
   `categories.icon` y se renderiza con `CategoryIcon` (el de la categoría
   seleccionada). *Verificado: "Película" muestra la claqueta.*

6. **Diagnóstico de fallos silenciosos.** Dos huecos de observabilidad cerrados:
   fallo HTTP de TMDB (`[tmdb] search failed: HTTP <status>`) y error del
   cliente admin al leer usuarios para los correos de amistad
   (`logSupabaseError` + aviso con la causa probable). Ambos visibles en los
   logs de Vercel — el segundo fue el que permitió cazar la causa raíz de la 1.4.4.

## Configuración de producción realizada en esta release

- **Send Email Hook habilitado en prod** (Authentication > Hooks + secreto
  `SEND_EMAIL_HOOK_SECRET` en la función): el OTP se renderiza per-skin/idioma.
- **`SUPABASE_SERVICE_ROLE_KEY` renovada en Vercel** (sospechosa inicial de los
  correos de amistad; la causa real resultó ser de grants → 1.4.4).
- **Tooling**: CLI de Supabase fijada como devDependency (`supabase@2.109.0`) y
  actualización semver-compatible de dependencias. Los saltos major
  (`typescript@6`, `@types/node@26`, `next` 16.2.10, `@supabase/ssr` 0.12)
  quedan pendientes a propósito.
