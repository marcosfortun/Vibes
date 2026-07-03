-- Grant mínimo para service_role: lectura de public.users.
--
-- La app cuenta con que el rol service_role (solo servidor) pueda leer usuarios:
--   - el cliente admin (src/lib/supabase/admin.ts) lee email/username/language/skin
--     para los correos de nueva amistad (src/lib/actions/friends.ts);
--   - la Edge Function send-email lee skin/language para personalizar el OTP.
-- En local ese acceso existe por los privilegios por defecto de la plataforma,
-- pero en producción no se aplicaron al crear las tablas (divergencia de
-- entorno) y ambos flujos fallaban con "permission denied for table users"
-- (42501): amistades sin correo y OTP siempre en inglés/skin por defecto.
--
-- Nota de seguridad: no amplía la superficie de cliente; service_role nunca
-- llega al navegador y los grants de anon/authenticated (pd-security-design.md)
-- no cambian. Se concede solo SELECT (lo que la app necesita hoy).

grant usage on schema public to service_role;
grant select on public.users to service_role;
