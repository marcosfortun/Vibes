# Mejoras release 1.5.0

**Hecho**:

**En proceso**:

Correos de amistad: prueba una invitación. Si no llegan, ve a Vercel → Settings → Environment Variables y comprueba que SUPABASE_SERVICE_ROLE_KEY coincide con la de Supabase → Settings → API (no pude compararlas por restricciones de permisos sobre secretos).

Panel Supabase → Authentication → Rate Limits: confirma 10 emails/h y 30 verificaciones (la CLI no mostró diff de esa sección y no estoy seguro de que la empujara).

Opcional — activar el hook per-skin/idioma: Authentication → Hooks → Send Email → tipo HTTPS → función send-email, copia el secreto generado y ejecuta npx supabase secrets set SEND_EMAIL_HOOK_SECRET="v1,whsec_...". Luego pide un OTP y comprueba que llega con tu skin.


* Funciona el autocompletado con steam y haiku, pero no con TMDB. ¿Por qué puede ser? Puede ser porque falta configurar las API Keys o porque falta indicar en BD la relación proveedor-categoría.
* Cuando selecciono un resultado generado con haiku, se inventa el enlace de IMDB de forma incorrecta. Mejor que la IA no invente enlaces, solo título, descripción y etiquetas.
* En los resultados del autocompletado, a la derecha hay un texto que indica cómo se ha conseguido el resultado. Me gusta, pero en español pone "AI" cuando debería ser "IA".
* En la pantalla de crear nueva recomendación, no muestra la lista completa de categorías en el desplegable cuando no hay texto de búsqueda. Cuando añades texto si busca correctamente y muestra los resultados.

- No me han llegado los emails de nueva amistad establecida.

**Pendiente**:

- Vista comprimida de la lista de tareas. Botón "más info" que despliega la tarjeta a pantalla completa.
- Posibilidad de añadir una imagen a las recomendaciones.
- Filtros de búsqueda en las listas (mi lista, amigos y tendencias). Tipo, tags, rango de valoración.
- Después del signup, aterrizar en una página/carrusel de onboarding.
- La sección "suerte" no carga.
- Revisar sección "quedada".
- Posibilidad de cargar recomendaciones en masa copiando cada título en una línea. Aplicar autocompletado en background.
- Posibilidad de descargar todas las recomendaciones de "mi lista" en un fichero CSV.
- Posibilidad de descargar todas las recomendaciones creadas por mi, en un fichero CSV.
- Bajo el botón de "más opciones", añadir opción "compartir" una recomendación con un amigo. Esto envía un enlace por redes sociales (WhatsApp, Telegram, etc). Al pulsar en ese enlace, la recomendación se añade automáticamente a "mi lista".
- Bajo el botón de "más opciones", añadir opción "eliminar". Solo si ningún otro usuario la tiene en "mi lista". En caso contrario, mostrar popup con mensaje explicativo del error.
- Al eliminar una categoría la app pregunta al admin otra categoría para poder cambiar todas las recomendaciones con la categoría eliminada.
- En la lista de tendencias el tiempo también debería influir en el orden.
- Caché: categorías, idioma...

- Especialización de las categorías:
  - rango de precio
  - localización
- Búsqueda externa: añadir más adaptadores reales (IMDB/Filmaffinity/Wikiloc) además de TMDB/Steam/IA.
- Proveedores por categoría: gestión visual desde el admin (hoy se siembran).
