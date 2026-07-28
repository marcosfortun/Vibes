# Mejoras release 1.5.0

Este documento contiene las especificaciones para el desarrollo de la release.

Este documento es editable exclusivamente por el usuario propietario del proyecto. Los demás interesados pueden leerlo y tomarlo como guía para desarrollar el proyecto, pero no pueden editarlo.

- Posibilidad de cargar recomendaciones en masa copiando cada título en una línea. Aplicar autocompletado en background.
- Vista comprimida de la lista de recomendaciones. Botón "más info" que despliega la tarjeta a pantalla completa.
- Corregir el icono y el nombre de instalación en el escritorio. Deberían ser los de la skin que tengas seleccionada.
- Posibilidad de añadir una imagen a las recomendaciones. En el caso de ser recomendación generada por IA, la imagen se obtiene de Wikipedia o de las fuentes especializadas por categoría.
- Añadida la fuente especializada "BoardGameGeek" como proveedor para juegos de mesa.
- Refactorizada la lógica de búsqueda, proveedores especializados y proveedores por defecto (fallback).
- Movido el servidor en Vercel a la región "dub1" (Dublín), igual que la base de datos en Supabase, que está en la región "eu-west-1" (Dublín).
- Paralelización de las llamadas de la home.
- Pantalla de carga para la home, crear recomendación, amigos y perfil.
- Bajar el límite del fallback de IA de 10 a 6 candidatos.
