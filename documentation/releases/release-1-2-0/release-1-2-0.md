# Mejoras release 1.2.0

**Hecho**:


**En progreso**:



**Pendiente**:

- Mejorar el flujo de añadir amigo:
  - No hay buscador de usuarios.
  - La única forma de añadir un amigo, es enviarle tu enlace de invitación (WhatsApp, Telegram, etc) y que pulse.
  - Si la persona que pulsa el enlace de invitación no tiene sesión abierta, se muestra pantalla de "login o crear cuenta".
  - Después se muestra pantalla de aceptar invitación. Si se acepta, se crea amistad bidireccional y se envía un email a ambos usuarios para notificar la nueva amistad.
- Solo se permiten amistades bidireccionales. Si eliminas a uno de tus amigos, se elimina la relación de amistad en ambas direcciones.
- Email de bienvenida cuando un usuario se da de alta.

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
- En la sección de "amigos" debe aparecer la opción de enviar enlace de invitación por redes sociales.
- Al eliminar una categoría la app pregunta al admin otra categoría para poder cambiar todas las recomendaciones con la categoría eliminada.
- Que el logo tenga fondo transparente.
