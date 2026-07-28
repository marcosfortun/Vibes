# Mejoras release 1.5.0

Este documento contiene las especificaciones para el desarrollo de la release.

Este documento es editable exclusivamente por el usuario propietario del proyecto.
Los demás interesados pueden leerlo y tomarlo como guía para desarrollar el proyecto, pero no pueden editarlo.

**Hecho**:

- Posibilidad de cargar recomendaciones en masa copiando cada título en una línea. Aplicar autocompletado en background.
- Vista comprimida de la lista de recomendaciones. Botón "más info" que despliega la tarjeta a pantalla completa.
- Corregir el icono y el nombre de instalación en el escritorio. Deberían ser los de la skin que tengas seleccionada.
- Posibilidad de añadir una imagen a las recomendaciones. En el caso de ser recomendación generada por IA, la imagen se obtiene de Wikipedia o de las fuentes especializadas por categoría.
- Añadida la fuente especializada "BoardGameGeek" como proveedor para juegos de mesa.
- Refactorizada la lógica de búsqueda, proveedores especializados y proveedores por defecto (fallback).
- Movido el servidor en Vercel a eu-west-1 (igual que la base de datos en Supabase)
- Paralelización de las llamadas de la home.
- Pantalla de carga para la home, crear recomendación, amigos y perfil.
- Bajar el límite del fallback de IA de 10 a 6 candidatos.

**En proceso**:

Cómo añadir el BGG_API_TOKEN

1. Obtener el token (https://boardgamegeek.com/using_the_xml_api)
2. Abre .env.local y edita BGG_API_TOKEN. Reinicio server local.
3. Vercel → vibes-web → Settings → Environment Variables → Add: BGG_API_TOKEN, entorno Production → Save, y luego un redeploy.
