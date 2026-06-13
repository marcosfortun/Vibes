# Mejoras release 1.3.0

**Hecho**:

- Se reestilan las pantallas con un diseño homogéneo.
- Retocar icono rosa de la barra superior de navegación.
- Logo (`/logo.jpg`) e icono de instalación PWA (`/icon.jpg`) en formato JPG en lugar de PNG/SVG, para reducir peso.
- Creado .env.example para guardarlo en el repo.
- Selector de skins para la UI.
  - Guardar skin en localhost para que se mantenga después de hacer logout.
  - Si la skin no está fijada en localhost ni en las preferencias de usuario, establecer una al azar en ambos.
- Añadir estas skins:
  - Nombre: Simple man; Estilo: minimal; Colores: blanco y negro; Logo: 5-a-logo.png; Icono: 5-a-icon.png
  - Nombre: Speciality popcorn; Estilo: flat design; Colores: azul marino profundo #17257d y coral vibrante #fe675c; Logo: 6-a-logo.png; Icono: 6-a-icon.png
  - Nombre: Stick stack; Estilo: neobrutalism; Colores: verde lima vibrante #b3fe05 y magenta neón #bc2a95; Logo: 7-a-logo.png; Icono: 7-a-icon.png
  - Nombre: PICO-8 pop; Estilo: pixel art; Colores: amarillo #FFD700 y verde azulado #2E4F4F; Logo: 8-a-logo.png; Icono: 8-a-icon.png
- Propuesta de categorías iniciales:
  - En casa: Serie de televisión, Película, Documental, Juego de mesa, Juego VR, Videojuego, Grupo de música, Podcast.
  - En la ciudad:Expo, Festival, Museo, Lugar emblemático, Monólogo, Teatro, Show.
  - En el campo: Ruta de ciclismo, Ruta de senderismo, Vía ferrata, Zona de baño, Zona de escalada, Zona de acampada.
- Pantalla de admin con botonera para opciones de administración.
- El scroll en la lista de categorías ya no hace desaparecer la cabecera.
- El formulario para crear categoría ahora tiene su propia pantalla. Añadido botón "+" en la cabecera para crear una nueva categoría.
- Al eliminar una categoría, te debe preguntar a qué otra categoría migrar las recomendaciones existentes que tengan la categoría que se va a eliminar.
- La botonera que hay en la pantalla de ajustes, ahora tiene la misma estética que la botonera de la página de admin (icono, nombre y flechita)
- El scroll en la lista de skins ya no hace desaparecer la cabecera (mismo patrón que amigos y categorías).
- Nuevo campo "tags" en crear recomendación (texto libre, máx. 5) con autocompletado ordenado por uso. Las etiquetas se muestran como chips de solo lectura en la ficha (entre valorar y guardar): 2 visibles con elipsis y un chip "…" que abre un popup con todas si hay más de 2. Retirado el botón de "más opciones" de la ficha.
- Multi-idioma automático (en/es/fr/pt) en recomendaciones, categorías y tags: se traducen al crear (Claude Haiku, no gestionable por el usuario) y se muestran en el idioma del usuario; sin API key o si falla, `translated=false` y fallback al texto origen.
- Categorías con lista de proveedores (0–3) para la búsqueda externa: catálogo TMDB/Steam/IA y asignación por categoría (sembrada; gestión visual en admin pendiente).
- Crear recomendación en 2 pasos: (1) autocompletado de categoría + buscador de título que combina recomendaciones internas similares y resultados externos (TMDB/Steam/IA), top 8 por similitud, selección obligatoria (o "crear desde cero"); existente → a Mi Lista; externa → (2) formulario pre-rellenado y editable que al guardar traduce y crea.

**En proceso**:


**Pendiente**:
- Proveedores por categoría: gestión visual desde el admin (hoy se siembran).
- Búsqueda externa: añadir más adaptadores reales (IMDB/Filmaffinity/Wikiloc) además de TMDB/Steam/IA.

- La sección "suerte" no carga.
- Revisar sección "quedada".
- Posibilidad de cargar recomendaciones en masa con un CSV de columnas: category,title,description,url,rating(-1,1,2,0 para añadir a mi lista sin dar una valoración).
- Posibilidad de descargar todas las recomendaciones de "mi lista" en un fichero CSV.
- Posibilidad de descargar todas las recomendaciones creadas por mi, en un fichero CSV.
- Bajo el botón de "más opciones", añadir opción "compartir" una recomendación con un amigo. Esto envía un enlace por redes sociales (WhatsApp, Telegram, etc). Al pulsa en ese enlace, la recomendación se añade automáticamente a "mi lista".
- Al eliminar una categoría la app pregunta al admin otra categoría para poder cambiar todas las recomendaciones con la categoría eliminada.
- En la lista de tendencias el tiempo también debería influir en el orden.
- Caché: categorías, idioma.

- Especialización de las categorías:
  - rango de precio
  - localización
