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
