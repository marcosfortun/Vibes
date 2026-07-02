# Mejoras release 1.5.0

**Hecho**:

**En proceso**:

- No funciona autocompletado Steam, TMDB y Haiku. Puede ser porque falta configurar las API Keys o porque falta indicar en BD la relación proveedor-categoría.

- Ampliar logitud del OTP a 8.
- Hay que poner un límite al número de solicitudes de OTP con un mismo usuario, para evitar spam a su email.
- Hay que poner un límite al número de intentos fallidos de validación del OTP con un mismo usuario, para evitar ataques de fuerza bruta.

- El logo del email del OTP no carga (skin: stick stack).
- Los emails de OTP no llegan con la skin apropiada, se debe leer del local storage.
- Los emails de OTP no llegan con el idioma apropiado, se debe leer de la configuración del navegador.
- El email de confirmación de alta no tiene márgenes y el botón CTA no sigue el estilo (skin: PICO-8 pop).

- No me han llegado los emails de nueva amistad establecida.

**Pendiente**:

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
