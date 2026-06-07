# Mejoras release 1.2.0

- Flujo de añadir amigo por invitación (rama `feature/friends`):
  - Eliminado el buscador de usuarios. La RLS de `users` ya no expone perfiles no-amigos (sin `is_searchable`) y se retiró el RPC `add_friend`.
  - Enlace de invitación personal y reutilizable (`/invite/<token>`), con caducidad de 48h, regenerable y revocable. Compartible por WhatsApp/Telegram/copiar desde la sección "amigos".
  - Al pulsar el enlace sin sesión se muestra "iniciar sesión o crear cuenta" (preservando el token); con sesión, la pantalla de aceptar invitación.
  - Al aceptar se crea la amistad **bidireccional** y se notifica por email a ambos usuarios, cada uno en su idioma (vía Resend).
  - El alta ya no crea la amistad automáticamente: los usuarios nuevos pasan también por la pantalla de aceptar (flujo uniforme).
  - Amistades solo bidireccionales: eliminar a un amigo borra la relación en ambas direcciones (`remove_friend`, sin cambios).
  - Variables de entorno nuevas (servidor): `RESEND_API_KEY`, `EMAIL_FROM`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
- Email de bienvenida cuando un usuario se da de alta.
- Mejorar estilos de todos los emails.
