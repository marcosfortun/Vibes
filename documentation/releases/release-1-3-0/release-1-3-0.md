# Mejoras release 1.3.0

**Hecho**:

- Se reestilan las pantallas con un diseño homogéneo.
- Retocar icono rosa de la barra superior de navegación.
- Logo (`/logo.jpg`) e icono de instalación PWA (`/icon.jpg`) en formato JPG en lugar de PNG/SVG, para reducir peso.

**En proceso**:

- Duda: ¿Cómo se gestionan las variables de entorno para los entornos de desarrollo (local) y producción?

**Pendiente**:

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
- En la lista de tendencias el tiempo también debería influir en el orden.
- Caché: categorías, idioma
