# Hotfix release 1.4.4 — Grants de service_role en producción

Hotfix sobre la rama `hotfix/1.4.4` (tag `v1.4.4`, 2026-07-03). Solo BD: sin
cambios de código ni redeploy de Vercel.

## Corrección

1. **Correos de amistad ausentes y OTP sin personalizar: misma causa raíz.**
   En producción el rol `service_role` no tenía `SELECT` sobre `public.users`
   (error `42501 permission denied`, cazado gracias al logging añadido en la
   1.4.3). Eso rompía dos flujos a la vez:
   - El **cliente admin** (`src/lib/supabase/admin.ts`) no podía leer
     email/username/language/skin de los dos amigos → la amistad se creaba pero
     **sin enviar los correos**.
   - La **Edge Function `send-email`** no podía leer skin/idioma del usuario →
     el OTP llegaba siempre con los valores por defecto (inglés + Stick stack).

   ¿Por qué solo en prod? En local los privilegios por defecto de la plataforma
   conceden acceso a `service_role` al crear tablas; en el proyecto cloud esos
   defaults no se aplicaron (divergencia de entorno: prod tenía privilegios
   parciales — `REFERENCES`, `TRIGGER`, `TRUNCATE` — pero no `SELECT`) y las
   migraciones nunca lo hicieron explícito.

   Migración `20260703130000_service_role_grants.sql`: `GRANT SELECT ON
   public.users TO service_role` — el mínimo que la app necesita. No amplía la
   superficie de cliente: `service_role` solo vive en el servidor y los grants
   por columna de `anon`/`authenticated` (pd-security-design.md) no cambian.
   *Verificado por el usuario en prod: correos de amistad recibidos y OTP en el
   idioma y skin del perfil.*
