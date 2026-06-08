# AI agent instructions

Antes de tocar código, lee y respeta este contrato de trabajo, y aplícalo siempre.

## 1. Idioma y trato

- Conversa siempre en español, en tono directo (sin formalismos).
- Cuando te dé una indicación clara, **no pidas confirmación entre subtareas**: implementa una mejora completa de extremo a extremo y, al terminar, propón el siguiente paso lógico.

## 2. Diseño antes que código

- Siempre debe haber un documento de diseño. Trátalo como **fuente única de verdad**. En caso de que haya cambios relevantes en el diseño, pregúntame si quiero actualizar el documento. No lo reescribas nunca sin mi consentimiento explícito.

- Para la seguridad (RLS, RPC, permisos por columna, gating de roles) escribe un documento aparte y respétalo al implementar.

## 3. Estructura fija de `documentation/`

Crea y mantén esta estructura desde el primer día:

```txt
documentation/
├── pd-product-design.md        # Fuente de verdad del producto. Solo lectura.
├── pd-security-design.md       # Fuente de verdad de las políticas RLS, RPC, grants.
├── test-users.txt              # Credenciales temporales. Añadir a gitignore.
├── pd-*.drawio.png             # Diagramas globales (arquitectura, schema, ...). Solo lectura.
├── wireframes/                 # Bocetos/mockups por pantalla (PNG). Solo lectura.
├── releases/                   # Contiene las especificaciones de cambio para cada release.
│   ├── CHANGELOG.md            # global, Keep a Changelog + SemVer.
│   └── release-X-Y-Z/          # Una carpeta como esta para cada release.
│       ├── release-X-Y-Z.md    # Fuente de verdad. Funcional con las mejoras de la versión "X.Y.Z". Solo lectura.
│       └── ui-X-Y-Z.png        # Imagen de referencia. Solo lectura.
└── ui/
    ├── style-guide.md          # Fuente de verdad sobre los estilos. Solo lectura.
    ├── preview.jpg             # Captura/mockup de un par de pantallas. Solo lectura.
    ├── design-tokens.json      # Color, gradient, radius, spacing, font, shadow, effect, component.
    ├── style-guide.mdx         # Paleta, tipografía, componentes, reglas.
    └── preview.tsx             # Componente documental autocontenido.
```

Reglas de mantenimiento (las aplicas tú, sin que tenga que recordártelo):

- Los ficheros marcados como "solo lectura", solo los puedes modificar con mi consentimiento explícito.
- Los ficheros marcados como "Añadir a gitignore", hay que añadirlos al .gitignore.
- **`test-users.txt`**: actualízalo cada vez que crees/elimines un usuario de prueba o cambies una contraseña.
- **`CHANGELOG.md`**: añade entradas en `[Unreleased]` mientras trabajamos; al cerrar una versión, muévelas a `[X.Y.Z] — fecha`.
- **`documentation/ui/`**: si cambias el tema visual, actualiza tokens + guía.
- **Especificación de release primero**: cualquier mejora nueva vive en `documentation/releases/release-X-Y-Z/` antes de implementarse. Trabajamos leyendo esos documentos como contrato.

## 4. Flujo de implementación

1. Antes de empezar algo grande, crea una lista de tareas con `TaskCreate` (una tarea por paso entregable). Marca `in_progress`/`completed` a medida que avanzas.
2. Verifica cada feature de extremo a extremo:
   - Build en verde.
   - Levanta el dev server y conduce el navegador para probar la UI real.
   - Cuando aplique, comprueba persistencia consultando la BD directamente.
3. Si encuentras un bug a mitad de camino, **arréglalo y documéntalo** (en memoria y, si procede, en el changelog). No lo dejes para después salvo que sea fuera de scope.
4. Cuida la i18n desde el principio: si la app soporta varios idiomas, añade las cadenas en todos los locales en el mismo turno.
5. Cuando termines de aplicar los cambios, haz un breve resumen de lo realizado y propón el siguiente paso más lógico.
