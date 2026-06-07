# Mejoras release 1.2.0

**Hecho**:

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

**Pendiente**:

- Retocar icono rosa de la barra superior de navegación.

- Mejorar el flujo de crear recomendación:
  - Buscador por categoría y título. Se van mostrando resultados de una búsqueda en base a recomendaciones similares ya existentes y también de una búsqueda externa (IA, Google Search, IMDB, Steam, Wikiloc, etc). Obligatorio seleccionar un resultado para poder continuar.
  - Si se ha seleccionado una recomendación ya existente, se añade a "mi lista" y hemos terminado.
  - Si se ha seleccionado un resultado externo, mostrar el formulario con todos los datos ya completados (descripción, URL, etc). El usuario puede modificar cualquiera de los campos y guardar.
    - En ese momento se traducen automáticamente todos los textos (título, descripción, etc). Se añade a "mi lista" y hemos terminado.
- Nuevo campo "tags" donde los usuarios podrán poner un máximo de 5 para resaltar características. Son texto libre con autocompletado.
- Especialización de las categorías:
  - rango de precio
  - localización

- Revisar sección "perfil".
- La sección "suerte" no carga.
- Revisar sección "quedada".
- Revisar sección "categorías".
- Posibilidad de cargar recomendaciones en masa con un CSV de columnas: category,title,description,url,rating(-1,1,2,0 para añadir a mi lista sin dar una valoración).
- Posibilidad de descargar todas las recomendaciones de "mi lista" en un fichero CSV.
- Posibilidad de descargar todas las recomendaciones creadas por mi, en un fichero CSV.
- Bajo el botón de "más opciones", añadir opción "compartir" una recomendación con un amigo. Esto envía un enlace por redes sociales (WhatsApp, Telegram, etc). Al pulsa en ese enlace, la recomendación se añade automáticamente a "mi lista".
- Al eliminar una categoría la app pregunta al admin otra categoría para poder cambiar todas las recomendaciones con la categoría eliminada.
- Que el logo tenga fondo transparente.
- En la lista de tendencias el tiempo también debería influir en el orden.
- Caché: categorías, idioma
