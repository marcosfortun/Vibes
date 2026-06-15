# Manual de Identidad de Marca y Justificación de Diseño: Vibes

**Autor:** Marcos Fortún

**Proyecto:** Vibes — Plataforma de Recomendación de Ocio para Grupos Cerrados

> Nota de versión: este manual se reescribe en la release 1.4.0. La identidad de
> Vibes deja de girar en torno a un único estilo ("La vie en rose") y adopta el
> concepto **camaleón**: una app de múltiples estilos que se adapta a los gustos
> de cada usuario. "La vie en rose" pasa a ser **una** de las skins disponibles.

---

## 1. Introducción y Filosofía del Proyecto

**Vibes** nace como una solución de ingeniería para centralizar y optimizar el
consumo de ocio en un grupo cerrado de amigos, pero también como una obra de autor
(*indie app*). Al ser un entorno controlado, alejado de la captación masiva, la
identidad visual se permite licencias expresivas y simbolismo personal.

A partir de la 1.4.0, esa libertad expresiva se formaliza en una tesis de producto:
**la interfaz no impone un estilo, lo elige el usuario.** Vibes es un camaleón.

---

## 2. Elección del Nombre: Vibes

La evolución desde "VibeCheck" hacia **Vibes** responde a síntesis y elegancia:

* **Alineación generacional:** entorno casual, joven y directo.
* **Sustento algorítmico:** el núcleo del producto mide las "vibraciones" y
  afinidades colectivas (consenso grupal para organizar quedadas).
* **Impacto estructural:** la **V** mayúscula aporta un eje geométrico vertical
  potente, ideal para el isotipo.

---

## 3. El Concepto Camaleón (núcleo de marca)

La marca Vibes no es un único lenguaje visual sino un **sistema de skins**
intercambiables. Cada skin es una dirección de arte completa y coherente (color,
tipografía, forma, sombra, radios) aplicada mediante el atributo `data-skin` en la
raíz del documento y un juego de variables CSS por estilo (`globals.css`).

Justificación conceptual: el ocio es identidad personal. Igual que cada amigo del
grupo tiene un gusto distinto, la app se **mimetiza** con quien la usa. El camaleón
no diluye la marca: la marca *es* la capacidad de adaptarse manteniendo el mismo
esqueleto funcional (las mismas tarjetas, el mismo dock, el mismo isotipo "V").

La skin viaja con el usuario más allá de la pantalla: **los correos** (bienvenida,
nueva amistad) se renderizan en la skin activa del destinatario, de modo que la
experiencia es coherente dentro y fuera de la app.

### 3.1 Skin por defecto

Cuando no hay preferencia (ni en BD ni en localStorage), Vibes se presenta en
**Stick stack** (`neobrutalism`): es la cara de marca por defecto y la que viste los
correos de sistema (OTP) durante el alta, antes de que el usuario elija la suya.

---

## 4. Catálogo de Skins

| Técnico (`users.skin`) | Comercial | Dirección de arte |
| --- | --- | --- |
| `neobrutalism` | **Stick stack** | Neobrutalismo: bordes negros gruesos, sombras duras desplazadas, lima + magenta de alto contraste sobre crema. *(Skin por defecto.)* |
| `cyberbotanical` | **La vie en rose** | Cyber-Botanical: dark mode, glassmorphism y neón synthwave (rosa + verde) sobre negro puro. La identidad original de Vibes. |
| `flat design` | **Speciality popcorn** | Flat design: superficies planas, azul índigo profundo y coral, sin glow. |
| `minimal` | **Simple man** | Minimalista claro y neutro: gris/blanco, acentos sobrios, sin neón. |
| `pixel art` | **PICO-8 pop** | Retro 8-bit: fondo verde azulado, amarillo de acento, tipografía monoespaciada, esquinas rectas. |

Cada skin define su propia paleta, tipografía (`--app-font`), radio de tarjeta y
tratamiento de borde/sombra. Al añadir una skin nueva: ampliar `SKINS` en
`src/lib/skins.ts`, su bloque `[data-skin="…"]` en `globals.css`, el CHECK
`users_skin_valid` en migración y su paleta de correo en `src/lib/email/palettes.ts`.

---

## 5. La skin "La vie en rose" (Cyber-Botanical) — legado de autor

La dirección original sigue viva como skin propia. Su simbología:

* **Rosa neón:** dinamismo de las interacciones, pulso de los votos, modernidad
  técnica. El color de la acción y del factor humano.
* **Verde neón:** crecimiento del catálogo, evolución del algoritmo de afinidad y
  firma botánica del autor. El color del ecosistema compartido.

### 5.1 La V Foliar

El isotipo integra rigidez digital y fluidez orgánica: un trazo izquierdo recto en
rosa (línea de código) y un trazo derecho verde que se curva en hoja nervada hasta
el capullo de una rosa. Cada skin reinterpreta el isotipo con sus propios assets
(`/logo-<skin>.png`, `/icon-<skin>.png`).

### 5.2 Paralelismo botánico (modelo mental del MVP)

| Concepto botánico | Equivalencia en el producto |
| --- | --- |
| **La semilla** | "Mi Lista" (`saved`): ocio latente a la espera de florecer. |
| **Crecimiento y ramificación** | Algoritmo de afinidad dinámica asimétrica. |
| **El huerto comunitario** | Catálogo neutro descentralizado, sin autoría pública. |
| **La polinización** | "Organizar Quedada": cruce de listas y afinidades → Top 3. |

---

## 6. Conclusión

Vibes demuestra que técnica y sensibilidad estética no son excluyentes. Con el
concepto camaleón, la marca se redefine: no es un color ni un estilo, sino un
ecosistema vivo que se adapta a cada persona del grupo manteniendo intacta su alma
funcional y su isotipo. La identidad de Vibes es, precisamente, su capacidad de ser
muchas y seguir siendo una.
