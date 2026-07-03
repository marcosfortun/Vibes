# Mejoras release 1.5.0

Este documento contiene las especificaciones para el desarrollo de la release.

Este documento es editable exclusivamente por el usuario propietario del proyecto.
Los demás interesados pueden leerlo y tomarlo como guía para desarrollar el proyecto, pero no pueden editarlo.

**Hecho**:

- Posibilidad de cargar recomendaciones en masa copiando cada título en una línea. Aplicar autocompletado en background.
- Vista comprimida de la lista de recmendaciones. Botón "más info" que despliega la tarjeta a pantalla completa.
- Corregir el icono y el nombre de instalación en el escritorio. Deberían ser los de la skin que tengas seleccionada.
- Posibilidad de añadir una imagen a las recomendaciones.

**En proceso**:

- Para ahorrar espacio en la lista de recomendaciones, vamos a quitar el botón de más info y hacemos que el click en el título abra la tarjeta a pantalla completa. En la tarjeta a pantalla completa, el click en la URL debe abrir una pestaña nueva en el navegador y cargar la URL.

- No me gusta como se ajusta la imagen de la tarjeta. En muchos casos se corta bastante y no se ve la cara de los actores. Lo he probado con las películas Matrix, Blade Runner y Enemy. Creo conveniente establecer este otro ajuste:

```css
max-height: calc(var(--spacing) * 60);
max-width: fit-content;
margin: auto;
object-fit: contain;
```

- En la tarjeta a pantalla completa, el botón de cierre del popup está bien posicionado arriba a la derecha, pero debe seguir la estética del resto de la aplicación (ver botón de volver atrás en la pantalla de amigos). El campo scoring debe estar abajo a la izquierda y debe tener el label "scoring" en inglés, "puntuación" en español, etc. El scroll debería afectar solo a la imagen y la descripción, de forma que el título, las etiquetas, el scoring y los botones de añadir a mi lista y valorar, queden siempre visibles.

- Deshabilitar temporalmente el botón de "suerte" porque no funcionará en esta release.
- Deshabilitar temporalmente el botón de "quedada" porque no está sin revisar por mi en esta release.

**Pendiente**:

- Imagen para resultados de IA (tu idea de Google Images): no implementada — no hay API gratuita fiable sin key ni riesgo de imágenes rotas/inapropiadas; lo dejo para valorar con calma. Las imágenes de TMDB/Steam sí funcionan.

- Optimizaciones:
  - Caché: categorías, idioma...
  - Paginación de listas de recomendaciones.
