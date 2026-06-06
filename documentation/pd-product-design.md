
# Vibes - Recomendaciones de ocio

## Diseño de producto

Marcos Fortún
27/05/2026

---

### Índice

* **Visión General y Alcance del MVP**
* **Arquitectura y Stack Tecnológico (Next.js + Supabase)**
* **Modelo de Datos, Índices y Esquema Relacional**
* **Autenticación Segura, Roles (User/Admin) e Invitaciones**
* **Catálogo Neutro de Recomendaciones y Motor de Deduplicación**
* **Flujo de Estados de Interacción ("Mi Lista" y Completados)**
* **Algoritmo de Afinidad Dinámica Asimétrica**
* **Estrategia de Scoring (Query-Time Math vs. Global Caché)**
* **Árbol de Decisión y Enrutamiento de la Pantalla de Inicio (Home)**
* **Módulo "Organizar Quedada" (Algoritmo de Consenso Grupal)**
* **Preferencias, Seguridad de Credenciales e Internacionalización (i18n)**
* **Conclusión y Próximos Pasos**

### Visión General y Alcance del MVP

Aplicación web-mobile diseñada para un grupo cerrado de amigos con el objetivo de centralizar y recomendar contenido de ocio (películas, series, juegos de mesa, videojuegos, rutas, etc.). El sistema elimina duplicados, mitiga fugas de privacidad mediante un catálogo neutro y personaliza los feeds usando un algoritmo de afinidad asimétrica dinámica.

El alcance queda cerrado con los siguientes pilares:

* **Catálogo neutro descentralizado:** Registro único de ítems sin autoría pública expuesta para proteger la privacidad de perfiles invisibles.
* **Gestión de estados:** Flujo interactivo donde "Mi Lista" actúa como un TODO list (`saved`) y los ítems se ocultan al pasar a `completed` (con puntuación obligatoria de -1, 1 o 2).
* **Grafo social restringido:** Registro exclusivo por invitación y buscador con opción de invisibilidad de perfil (`is_searchable = false`).
* **Algoritmo de Afinidad Dinámica:** Ponderación asimétrica automática entre amigos (0-10) que calcula el scoring personalizado en tiempo de ejecución, con opción de desactivación global para usar un `global_score` indexado en caché.
* **Módulo "Organizar quedada":** Función de consenso grupal que cruza las listas de los amigos presentes para arrojar un Top 3 de recomendaciones óptimas instantáneas.
* **Control Admin:** Panel exclusivo para el usuario semilla (`admin@example.com`) encargado de dar de alta categorías fijas globales de forma segura.

### Arquitectura y Stack Tecnológico

* **Framework:** Next.js (App Router) desplegado en Vercel. Uso prioritario de *Server Components* y *Server Actions* para comunicación directa con la base de datos, eliminando el boilerplate de una API REST intermedia.
* **Base de Datos y Autenticación:** Supabase (PostgreSQL) bajo el tier gratuito.
  * Extensión `pg_trgm` habilitada para resolver la deduplicación difusa de contenidos y categorías en el catálogo neutro.
  * Supabase Auth para gestionar sesiones, flujos de invitación restringidos, cambio de contraseña en preferencias y recuperación de credenciales mediante respuestas opacas.
* **Estado en Cliente:** Zustand o React Context para configuraciones volátiles e internacionales (idioma de interfaz `en`, `es`, `fr`, `pt` y alternancia del scoring por afinidad).
* **Estructura de Sincronización:** Peticiones HTTP estándar basadas en la interacción del usuario; sin consumo de WebSockets ni tiempo real para mitigar la sobreingeniería y asegurar el coste cero.

### Modelo de Datos, Índices y Esquema Relacional

#### Tablas y Restricciones (PostgreSQL)

* **`users`**: `id` (PK), `email`, `username`, `role` (`user` | `admin`), `is_searchable` (boolean), `language` (enum), `use_affinity_scoring` (boolean), `created_at`.
* **`categories`**: `id` (PK), `name` (unique), `icon` (string/slug), `color` (hex), `created_at`.
* **`recommendations`**: `id` (PK), `title`, `description`, `category_id` (FK), `global_score` (int, cached), `created_by` (FK, para auditoría interna), `created_at`.
* **`user_interactions`**: `id` (PK), `user_id` (FK), `recommendation_id` (FK), `status` (`saved` | `completed`), `rating` (int, NULL si es `saved`, obligatorio `NOT NULL` si es `completed`), `updated_at`.
  * *Check Constraint:* `rating` IN (-1, 1, 2) $\to$ `no_me_gusta` (-1), `me_gusta` (1), `me_gusta_mucho` (2).
* **`friendships`**: `user_id` (FK), `friend_id` (FK), `affinity` (numeric, default 5.0), `updated_at`.
  * *PK Compuesta:* `(user_id, friend_id)`.
  * *Check Constraint:* `affinity BETWEEN 0 AND 10`.
* **`invitation_tokens`**: `id` (PK), `token` (string, unique), `generated_by` (FK), `is_used` (boolean, default false), `expires_at` (timestamp), `created_at`.

#### Índices Críticos (Optimización de Rendimiento)

* **`user_interactions`**: Índice compuesto btree en `(user_id, status, recommendation_id)` para acelerar drásticamente las consultas del árbol de decisión de la Home y optimizar los filtros por lote de ítems pendientes (`saved`) en el módulo "Organizar Quedada".
* **`recommendations`**:
  * Índice btree en `global_score` para servir instantáneamente la pestaña de "Tendencias globales" cuando la caché está activa.
  * Índice btree en `created_by` dedicado a tareas exclusivas de depuración y auditoría del administrador.
  * Índice GIST/GIN utilizando la extensión `pg_trgm` sobre el campo `title` para resolver las búsquedas difusas de duplicados en tiempo real.

### Autenticación Segura, Roles (User/Admin) e Invitaciones

* **Registro Restringido (Invite-Only):** No se permite el registro libre en la plataforma. El formulario de alta de usuarios requiere obligatoriamente un token válido de invitación de amistad (`/signup?invite_token=...`) generado por un usuario activo. El rol asignado automáticamente a estos nuevos perfiles es `user`.
* **Usuario Administrador Sembrado:**
  * **Email:** `admin@example.com`
  * **Username:** `Marcos`
  * **Rol:** `admin`
  * *Privilegios:* Es el único rol con acceso visual y operativo a la sección "Admin" en el menú principal para la creación de categorías fijas globales.
* **Mitigación de Enumeración (Seguridad):** Los flujos de inicio de sesión y recuperación de contraseña utilizan respuestas genéricas opacas. La interfaz nunca revelará si el email introducido no existe o si la contraseña es el único dato incorrecto para bloquear ataques de escaneo.
* **Gestión de Credenciales en Preferencias:** El formulario para cambiar la contraseña desde el panel de configuración exige la validación obligatoria de la contraseña actual antes de persistir el nuevo hash en Supabase Auth, previniendo secuestros de cuenta en dispositivos desatendidos.
* **Grafo Social Automatizado al Alta:** Al procesarse un registro exitoso utilizando un token de invitación, el sistema insertará de forma automática y obligatoria una relación de amistad bidireccional en la tabla `friendships` entre el usuario recién creado y el usuario anfitrión (`generated_by`), inicializada con una afinidad por defecto de `5.0`. Esto evita que los nuevos usuarios queden aislados y asegura que su feed empiece a funcionar desde el primer segundo.
* **Nota de Configuración de Seguridad (Supabase Auth):** Para cumplir estrictamente con la mitigación de ataques de enumeración (escaneo de correos), es un requisito de despliegue activar explícitamente el flag **"Enable email enumeration prevention"** en el panel de control del proyecto de Supabase (ruta: *Authentication ➔ Auth Providers ➔ Email*). Sin este flag activo, la API por defecto de Supabase podría revelar la existencia de cuentas a través de ciertos mensajes de error.

### Catálogo Neutro de Recomendaciones y Motor de Deduplicación

* **Privacidad de Datos y Aislamiento:** Las recomendaciones pertenecen a un catálogo global neutro desvinculado de cualquier autoría pública en la interfaz de usuario. El cliente final no puede ver quién dio de alta originalmente el registro; esto evita que la actividad de un usuario con perfil invisible (`is_searchable = false`) sea expuesta indirectamente si otro usuario intenta registrar el mismo elemento y el sistema se lo sugiere.
* **Motor de Deduplicación Diferencial:** Al iniciar el flujo de creación de una recomendación (o de una categoría en el panel de administración), el sistema realiza una consulta de búsqueda difusa en tiempo de escritura utilizando la extensión `pg_trgm` de Supabase (PostgreSQL) sobre el campo `title`. El cliente renderiza dinámicamente las sugerencias con mayor índice de similitud tipográfica antes de permitir la persistencia, forzando la unicidad de los nodos del catálogo.

### Flujo de Estados de Interacción ("Mi Lista" y Completados)

* **Estado `saved` ("Mi Lista"):** Funciona estrictamente como un TODO list personal de actividades pendientes de consumir.
* **Estado `completed` ("Completado"):** Oculta de forma automática la recomendación de "Mi Lista" del usuario, pero la mantiene expuesta en los feeds de exploración de sus amigos. Este estado exige una calificación obligatoria con restricción `NOT NULL` que toma valores del conjunto estricto `{-1, 1, 2}` (`no_me_gusta`, `me_gusta`, `me_gusta_mucho`).
* **Transiciones y Reversibilidad:** Las interacciones no son definitivas. Un usuario puede cambiar su valoración asignada en el futuro, o eliminar por completo el registro de la relación intermedia, devolviendo el ítem al catálogo limpio (sin estado asociado).

### Algoritmo de Afinidad Dinámica Asimétrica

* **Propiedad:** La afinidad es unidireccional y asimétrica ($A \to B \neq B \to A$). Rango rígido entre 0 y 10, inicializado en 5. Editable de forma manual en la configuración de amigos.
* **Ajuste Automático y Control de Deriva (Trigger de BD):** Se dispara un Trigger en la tabla `user_interactions` tras cualquier evento que afecte a una calificación coincidente entre amigos. Para evitar que la edición recurrente de un voto corrompa o desplace la afinidad de forma infinita hacia los extremos, el trigger calcula el diferencial del impacto ($\Delta$) evaluando el estado de la operación (`TG_OP`):

$$\Delta = (\text{abs}(\text{calificación\_mía} - \text{calificación\_amigo}) - 1) \times (-1)$$

* **Reglas lógicas del Trigger:**
  * **INSERT:** Se calcula el $\Delta$ y se suma directamente al acumulado actual.
  * **UPDATE (Edición de voto):** Se calcula el $\Delta_{\text{nuevo}}$ con la nueva calificación y el $\Delta_{\text{antiguo}}$ con el voto previo. El ajuste real aplicado a la afinidad es la diferencia neta: $(\Delta_{\text{nuevo}} - \Delta_{\text{antiguo}})$.
  * **DELETE (Reversibilidad):** Si un usuario elimina su interacción, se calcula el $\Delta_{\text{antiguo}}$ que aportaba ese voto y se resta por completo de la afinidad para revertir su impacto.
  * **Direccionalidad de la Actualización:** Cuando el **Usuario A** realiza una acción sobre su calificación, el trigger localiza en la base de datos a todos los amigos (**Usuario B**) que ya cuenten con una calificación en ese mismo ítem de ocio. El sistema recalculará y actualizará únicamente la fila en `friendships` donde `user_id = A` y `friend_id = B`. En consecuencia, lo que se altera es la afinidad que *A tiene hacia B*, ya que es el Usuario A quien experimenta la alineación o desalineación con la postura que su amigo ya había tomado previamente.

Tras cualquier operación, el resultado se trunca estrictamente dentro de los límites físicos del sistema:

$$\text{afinidad} = \max(0, \min(10, \text{afinidad} + \text{ajuste}))$$

### Estrategia de Scoring (Query-Time Math vs. Global Caché)

* **Scoring por Afinidad Desactivado (Por defecto):** Utiliza el campo precalculado e indexado `global_score` ($\sum \text{calificaciones}$) en la tabla `recommendations`. Permite una lectura directa y óptima mediante caché en la base de datos para servir las listas estándar y la pestaña de "Tendencias globales" con latencia mínima. Reglas del trigger encargado de mantener viva esa caché:
  * Si se inserta un `completed` con nota, se suma al `global_score`.
  * Si se edita la nota, se calcula la diferencia y se actualiza el `global_score`.
  * Si se elimina la interacción (reversibilidad), se resta la nota que existía del `global_score`.
* **Scoring por Afinidad Activado:** Invalida la caché global y ejecuta álgebra en tiempo de ejecución (*Query-time math*) en la base de datos, ponderando **exclusivamente** las calificaciones de los amigos directos del usuario según la siguiente fórmula:

$$\text{Scoring Personalizado} = \sum \left( \frac{\text{calificación\_amigo} \times \text{afinidad\_hacia\_amigo}}{5} \right)$$

* **Optimización de rendimiento:** Para mitigar el impacto en la CPU de Supabase al activar el cálculo dinámico, las consultas se apoyan estrictamente en los índices compuestos btree de las tablas `friendships(user_id, friend_id)` y `user_interactions(user_id, status, recommendation_id)`.
* **Naturaleza y Orden del `global_score`:** Debido a que el sistema admite penalizaciones de `-1` (`no_me_gusta`), el campo precalculado `global_score` puede tomar valores negativos si un contenido acumula el rechazo mayoritario del grupo de amigos. La pestaña de **"Tendencias globales"** ordenará el catálogo de forma estricta mediante `global_score DESC`, lo que permite procesar números negativos de forma natural y desplazar automáticamente el contenido impopular al fondo de la lista sin romper la interfaz.

### Árbol de Decisión y Enrutamiento de la Pantalla de Inicio (Home)

Tras iniciar sesión o registrarse, el sistema evalúa secuencialmente el estado de las interacciones del usuario en el servidor para definir la pestaña activa por defecto al aterrizar en la pantalla de inicio:

1. **¿"Mi Lista" contiene ítems pendientes (`status = 'saved'`)?**
  * **SÍ** $\rightarrow$ Se renderiza la pestaña **"Mi Lista"** por defecto.
  * **NO** $\rightarrow$ Pasa al siguiente criterio de evaluación.
2. **¿Existen recomendaciones de amigos disponibles en el feed?**
  * **SÍ** $\rightarrow$ Se renderiza la pestaña **"Recomendaciones de amigos"** por defecto.
  * **NO** $\rightarrow$ Pasa al criterio por defecto.
3. **Criterio por defecto:**
  * Se muestra la lista de **"Tendencias globales"** ordenando el catálogo por el `global_score` precalculado.

> **Regla de navegación:** La sección de "Tendencias globales" no queda oculta ni restringida según el número de amigos; se mantiene siempre visible y accesible de forma manual para todos los usuarios de la plataforma como una opción de exploración permanente.

### Módulo "Organizar Quedada" (Algoritmo de Consenso Grupal)

* **Flujo de Usuario:** Desde la interfaz, el usuario puede marcar mediante *checkboxes* qué amigos del grupo están presentes físicamente en la reunión o quedada.
* **Lógica de la Consulta (RPC en Supabase):** Al confirmar, el sistema ejecuta una función remota en la base de datos que realiza los siguientes pasos en tiempo de ejecución:
  1. **Filtrado de Pendientes:** Selecciona únicamente los ítems del catálogo que se encuentren guardados (`status = 'saved'`) en "Mi Lista" de **al menos uno** de los amigos asistentes.
  2. **Exclusión de Completados:** Filtra y elimina automáticamente cualquier contenido que **ya haya sido completado** (`status = 'completed'`) por cualquiera de las personas presentes en la quedada, garantizando que el grupo solo reciba propuestas totalmente nuevas para todos.
  3. **Ponderación Colectiva:** Cruza las matrices de afinidad unidireccionales de los asistentes para calcular un scoring ponderado grupal optimizado.

$$SG = \frac{1}{n} \sum_{i=1}^{n} \text{Scoring Personalizado}_i$$

  4. **Output:** Ordena los resultados de mayor a menor coincidencia y devuelve un **Top 3** de recomendaciones ideales para consumir de forma colectiva en ese mismo momento.

### Preferencias, Seguridad de Credenciales e Internacionalización (i18n)

* **Internacionalización (i18n):** La interfaz de la aplicación se adapta dinámicamente según la preferencia guardada en el perfil del usuario. El idioma predeterminado del sistema es el inglés (`en`), ofreciendo soporte nativo completo para español (`es`), francés (`fr`) y portugués (`pt`).
* **Configuración del Motor de Scoring:** El panel de preferencias permite activar o desactivar de forma voluntaria la ponderación del scoring por afinidad (desactivada por defecto). Cuando un usuario la apaga, el sistema conmuta de inmediato al uso del `global_score` precalculado en caché para optimizar el rendimiento y ahorrar cómputo en la base de datos.
* **Seguridad de Credenciales:** El cambio de contraseña dentro de la sección de configuración exige la validación obligatoria de la contraseña actual antes de actualizar el nuevo hash en Supabase Auth, bloqueando posibles secuestros de cuenta si el dispositivo se queda desbloqueado.

### Conclusión y Próximos Pasos

Con la definición de estos bloques estructurales, el proyecto queda completamente consolidado como un MVP ágil, de alta fidelidad funcional y con un coste de infraestructura cero.

Esta especificación técnica queda cerrada y validada como la **fuente única de verdad del proyecto**, lista para ser utilizada como plano de ingeniería.

---

With love by Marcos
