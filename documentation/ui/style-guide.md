# Cambios UX/UI release 1.1.0

Aquí tienes la guía de diseño detallada para replicar con exactitud esta interfaz. El estilo visual se puede definir como una mezcla de **Cyberpunk/Synthwave minimalista** con toques de **Glassmorphism** (efecto de vidrio esmerilado).

---

## 1. Paleta de Colores y Estilo Visual

* **Fondo General:** Negro mate profundo (`#000000` / `#18181c`).
* **Colores de Acento (Gradientes Neon):**
  * **Rosa Neón:** (`#ff2a75` / `#ff5e97`)
  * **Verde/Cian Neón:** (`#39ff85` / `#7cfa9c`)
* **Textos:**
  * **Principal:** Blanco puro (`#FFFFFF`) para títulos y elementos activos.
  * **Secundario/Muted:** Gris claro/medio (`#8E8E93` o `#A1A1AA`) para subtítulos y elementos inactivos.
* **Efectos clave:**
  * **Glow (Resplandor):** Sombras difuminadas (`box-shadow`) con los colores de acento para dar el efecto de luz neón.
  * **Glassmorphism:** Fondos semi-transparentes con desenfoque de fondo (`backdrop-filter: blur(15px)`).
* **Color de Alerta / Destructivo (Rojo Neón):** (`#ff0055` o `#ff3366`). Un tono magenta/rojo de alta luminancia para acciones críticas ("Eliminar", "Quitar", desalineaciones algorítmicas) que se integra en el espectro Synthwave sin romper la armonía.
* **Bordes Muted (Baja Opacidad):** `rgba(255, 255, 255, 0.1)` para líneas divisorias y contenedores secundarios que no deban competir con el resplandor (glow) principal.

---

## 2. Tipografía

Se utiliza una fuente **Sans-Serif** geométrica, limpia y moderna (estilo *San Francisco* de Apple o *Inter*).

* **Títulos de Tarjetas (Matrix, Catan):** Tamaño grande, peso **Bold** (Negrita), color blanco.
* **Pestañas y Etiquetas del Menú:** Tamaño mediano, peso **Medium**.
* **Subtítulos (Clásico ciberpunk...):** Tamaño pequeño, peso **Regular**, color gris.

---

## 3. Distribución y Componentes

### A. Barra de Navegación Superior (Tabs)

* **Estructura:** Tres pestañas alineadas horizontalmente con distribución equitativa: `Mi Lista`, `De Amigos`, `Tendencias`.
* **Elemento Activo (`Mi Lista`):** Textos en blanco brillante. Debajo lleva una línea de selección fina con un degradado que va de rosa a cian. En el centro exacto de esta línea, se superpone un icono realista de una **rosa rosa con tallo verde**.
* **Elementos Inactivos:** Texto en gris con menor opacidad.

### B. Tarjetas de Contenido (Cards)

Cada elemento de la lista está contenido en una tarjeta rectangular con las siguientes características:

* **Bordes:** Esquinas redondeadas (aproximadamente `border-radius: 20px`). El borde tiene un degradado lineal horizontal: **Rosa neón en la izquierda que se desvanece hacia el Verde/Cian neón en la derecha**. Tienen un sutil efecto de resplandor (*glow*).
* **Fondo de la tarjeta:** Ligeramente más claro que el fondo general (`#18181C`), con una opacidad muy alta (casi opaco).
* **Distribución interna:**
* **Esquina superior izquierda:** Icono lineal en color rosa neón (Claqueta para *Matrix*, Dado para *Catan*, Libro abierto para *Dune*).
* **A continuación del icono y en la misma línea:** Título en blanco (Bold) y justo abajo el subtítulo descriptivo en gris (alineado a la izquierda con el icono).
* **Fila de interacción inferior:** Dividida en dos grupos.
* *Grupo Izquierdo:* Contenedor estilo "cápsula" semi-transparente que agrupa tres iconos: Pulgar abajo (Dislike), Pulgar arriba (Like) y Corazón (Favorito). El corazón tiene un fondo ligeramente iluminado si está inactivo.
* *Grupo Derecho:* Dos botones circulares independientes. El primero es un botón de añadir (`+`) con borde gris. El segundo es un botón de opciones (`...`) con borde verde/cian neón.

---

### C. Barra de Navegación Inferior (Floating Dock)

Es un menú flotante estilo cápsula que no llega a los bordes de la pantalla.

* **Estilo del Contenedor:** Fondo gris oscuro semi-transparente con esquinas muy redondeadas (`border-radius: 30px`) y un fuerte efecto de **desenfoque de fondo** (Glassmorphic blur). Tiene un borde superior muy fino y tenue.
* **Elementos (5 Items):**
  * **Mi lista:** Icono de tres líneas con puntos (menú). Al estar activo, tiene un **punto rosa neón** debajo.
  * **Suerte:** Icono de un dado en perspectiva.
  * **Añadir (Botón Central):** Es el elemento jerárquico más importante. Sobresale ligeramente por la parte superior del dock. Es un círculo con un degradado perimetral neón (rosa a cian) muy brillante y un icono de `+` en el centro. Tiene un efecto de resplandor circular de fondo.
  * **Quedada:** Icono de un rayo.
  * **Perfil:** Icono de un avatar (silueta de usuario dentro de un círculo).

---

### 3.D. Jerarquía de Botones (Buttons)

Para evitar la disparidad de estilos visuales entre pantallas, se establecen tres únicas variantes obligatorias para toda la aplicación:

* **Botón Principal (Primary - Bloque Completo):**
  * **Uso:** Acciones clave que avanzan el flujo (Entrar, Guardar, Sugerir, Compartir).
  * **Estilo:** Fondo con degradado lineal horizontal de Rosa Neón a Verde/Cian Neón. Texto en negro puro (`#000000`) o blanco puro (`#FFFFFF`) con peso Bold.
  * **Dimensiones:** Alto fijo de `50px`, esquinas redondeadas (`border-radius: 25px`). Ancho adaptable al contenedor (Full width en móviles) con padding horizontal de `24px`.
  * **Efecto:** Sutil glow perimetral del color de acento dominante.
* **Botón Secundario / Acción Neutra (Outline):**
  * **Uso:** Acciones secundarias o de configuración (Copiar, Cerrar Sesión, Añadir categorías).
  * **Estilo:** Fondo transparente. Borde fino de `1px` sólido en gris secundario (`#8E8E93`) o blanco con opacidad (`rgba(255,255,255,0.2)`). Texto en blanco.
  * **Dimensiones:** `border-radius: 20px` o idéntico al contexto de la línea. Alto reducido a `40px` para botones en línea.
* **Botón Destructivo (Danger Link / Button):**
  * **Uso:** Eliminar ítems o deshacer amistades de forma explícita.
  * **Estilo:** Texto plano en Rojo Neón (`#ff0055`). Sin fondo ni bordes en listados integrados. Para botones independientes, usa la estructura del Botón Secundario pero sustituyendo el gris por el contorno en Rojo Neón.

---

### 3.E. Componentes de Formulario (Form Inputs & Selects)

Todos los elementos de entrada de datos deben abandonar los estilos nativos del sistema operativo y unificarse bajo la estética Dark Glassmorphism.

* **Campos de Texto e Inputs (`input[type="text"]`, `textarea`):**
  * **Fondo:** Gris oscuro semi-transparente (`#18181C` con opacidad del 60% al 80%).
  * **Bordes:** `1px` sólido utilizando el color Muted (`rgba(255, 255, 255, 0.1)`). Esquinas redondeadas fijas a `border-radius: 12px` (evitar esquinas rectas o excesivamente redondas estilo píldora que comprometan la lectura).
  * **Estado Focus:** Al hacer clic, el borde conmuta de forma animada a Rosa Neón o Verde Neón (según el contexto de la pantalla) con una sombra difuminada (`box-shadow: 0 0 8px [color]`).
* **Textos:** Tipografía en Blanco Puro (`#FFFFFF`) para el texto introducido y Gris Medio (`#8E8E93`) para el placeholder.
* **Desplegables (`select`):**
  * Debe replicar exactamente la misma caja, fondo y bordes que los inputs tradicionales.
  * **Propiedad Crítica:** Ocultar la flecha nativa del sistema (`appearance: none; -webkit-appearance: none;`). En su lugar, se inyectará un icono vectorial personalizado (flecha hacia abajo o chevron) en color gris claro (`#8E8E93`), posicionado a la derecha con un padding interno de `16px`.
* **Casillas de Selección (`checkbox`):**
  * Quedan prohibidos los checkboxes nativos del navegador. El elemento debe renderizarse como un contenedor personalizado de `20px` por `20px`, `border-radius: 6px`, fondo negro profundo (`#000000`) y borde de `1px` en Gris Secundario.
  * **Estado Activo (Checked):** El interior se tiñe de Verde Neón con un check interno en blanco o negro, activando un micro-resplandor a su alrededor.

---

### 3.F. Cabeceras de Páginas Internas y Navegación Secundaria

Para las pantallas que no corresponden a la Home y requieren flujo de retorno (ej. Configuración de amigos, Panel de administración):

* **Estructura Header:** Un contenedor flexible (`display: flex; align-items: center;`) con una altura de `64px` y márgenes laterales fijos de `16px`.
* **Botón de Retroceso (`←`):** Un círculo perfecto de `40px` de diámetro, fondo `#18181C` semi-transparente, borde de `1px` Muted y un icono de flecha limpia en color blanco brillante en su interior.
* **Título de la Página:** Tipografía geométrica tamaño `24px` (`text-2xl`), peso Bold (Negrita), color blanco puro. Separado por un margen izquierdo constante de `16px` respecto al botón de retroceso.

---

### 3.G. Listas Estructuradas (Filas de Categorías y Amigos)

Cuando los elementos no se organicen en tarjetas completas de contenido (Cards), sino en listas verticales (Amigos, Categorías existentes):

* **Fila Contenedora:** Cada registro debe vivir en una fila con fondo `#18181C` de esquinas sutilmente redondeadas (`border-radius: 12px`), separadas entre sí por un espacio constante de `8px` (nunca pegadas en bordes compartidos).
* **Indicador de Estado / Identidad:** En el extremo izquierdo, se antepone un punto de color brillante o un icono representativo (ej. el círculo de categoría o color de la misma), alineado simétricamente con el texto.
* **Acciones Derechas:** Los controles de edición o eliminación ("Quitar", "Eliminar") se posicionan en el extremo derecho mediante alineación flexible, manteniendo un área de pulsación cómoda y utilizando el color Rojo Neón para advertencias destructivas.

---

## 4. Especificaciones para Desarrollo (CSS / Tailwind aproximado)

> **Nota de diseño:** Para lograr el degradado en los bordes redondeados de las tarjetas sin que se corte en las esquinas, recuerda usar `border: 1px solid transparent; background-img: linear-gradient(...), linear-gradient(...); background-clip: padding-box, border-box;` o aplicar un pseudo-elemento `::before` con `inset: 0` y `mask-composite`.

Para el dock inferior, el efecto clave en CSS es:

```css
background: rgba(30, 30, 35, 0.6);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

---

## 5. Correos electrónicos (Emails)

Todos los correos informativos se envían en **HTML** con una estructura rígida que
emula la interfaz de la app. Implementación: `src/lib/email/template.ts` (primitivas
+ documento) y `src/lib/email/resend.ts` (composición y envío). Los textos viven en
i18n (`messages/*.json`, namespace `Email`) y se envían en el idioma del destinatario.

* **Fondo del correo (canvas):** Negro mate `#000000`.
* **Contenedor central (card):** Fondo `#18181C`, `border-radius: 16px`, con un borde
  superior de 3px con degradado **Rosa Neón → Verde Neón** (`linear-gradient(90deg,#ff2a75,#39ff85)`).
* **Tipografía:** Sans-serif del sistema (`Inter, Helvetica, Arial, sans-serif`).
  Texto principal blanco `#FFFFFF`; secundario gris `#A1A1AA`.
* **Botón principal:** Píldora (`border-radius: 9999px`) con degradado Rosa→Verde y
  texto negro `#000000`. Color sólido `#ff2a75` como *fallback* (clientes sin gradiente).
* **Botón secundario (outline):** Píldora con borde `rgba(255,255,255,0.35)` y texto blanco.
* **Remitente unificado:** Display Name siempre **Vibes** (`EMAIL_FROM="Vibes <…>"`
  para Resend; en Supabase Auth, *Sender name = Vibes* en el panel cloud).

Compatibilidad: layout con tablas y estilos en línea. Los valores interpolados de
usuario se escapan (`escapeHtml`).

### Catálogo de correos

| Correo | Disparador | Remite | Botón |
| --- | --- | --- | --- |
| **A. Bienvenida** | Alta con token válido (`sendWelcomeEmail`) | Resend/Mailpit | Principal — *Entrar a Vibes* |
| **B. Reset de contraseña** | Solicitud desde login (`resetPasswordForEmail`) | **Supabase Auth** (plantilla `supabase/templates/recovery.html`, asunto en `config.toml`) | Principal — *Configurar nueva contraseña* (`{{ .ConfirmationURL }}`) |
| **C. Nueva amistad** | Aceptar invitación (`sendFriendshipEmails`) | Resend/Mailpit | Secundario/outline — *Ver el feed* |

> **B (reset)** lo gestiona Supabase Auth para preservar el flujo PKCE, por lo que su
> plantilla es única (español). A y C están localizados por destinatario (en/es/fr/pt).
> En local todos los correos se capturan en **Mailpit** (`http://localhost:54324`).
