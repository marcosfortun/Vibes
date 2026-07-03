# Mejoras release 1.4.0 — Acceso sin contraseñas (Email OTP) y app camaleón

Release estructural. Dos ejes: (1) eliminar por completo las contraseñas y pasar a
acceso por **Email OTP** (que además valida la propiedad del correo), y (2) consolidar
el concepto **camaleón** (app multi-estilo) llevándolo también a los correos.

## 1. Autenticación sin contraseñas (Email OTP)

- **Login y signup por código OTP** de 6 dígitos enviado al correo, con caducidad de
  **1 hora**. El propio OTP valida que el correo pertenece al usuario, cerrando el
  vector de suplantación que tendría un alta sin verificación.
- **Se eliminan las contraseñas** y todo lo asociado: recuperación de contraseña,
  cambio de contraseña, pantallas `/forgot` y `/update-password`, el callback PKCE
  `/auth/callback` y la plantilla `recovery`.
- **Flujo de dos pasos** (campo oculto `step`): `request` (validar + enviar código) →
  `verify` (introducir código + abrir sesión). Reenvío de código disponible.
- **Signup invite-only**: se mantiene el gate por token de invitación. Validación previa
  de invitación y de disponibilidad de username (errores claros antes del trigger).
  El usuario se crea vía `signInWithOtp({ shouldCreateUser: true, data })`; el trigger
  `handle_new_user` sigue creando `public.users` desde `raw_user_meta_data`.
- **Sesiones de larga duración**: no caducan (sin time-box ni inactivity timeout), para
  no obligar a copiar el código a menudo. Se configura en el panel (Auth > Sessions) y
  en `config.toml` (`[auth.sessions]`).

## 2. Selección de skin en el alta

- Tras verificar el correo, el usuario aterriza en **`/welcome`** y elige su skin
  (con **Stick stack** preseleccionada). La elección se aplica al instante y se persiste
  en `users.skin` + localStorage. Después se envía la bienvenida (con esa skin) y se
  continúa al destino original (normalmente aceptar la invitación).

## 3. Skin por defecto: Stick stack

- La skin por defecto deja de ser aleatoria: cuando no hay preferencia (ni en BD ni en
  localStorage) se usa **Stick stack** (`neobrutalism`). Afecta a boot script, layout y
  `SkinManager`.

## 4. Correos corporativos por skin

- Todos los correos comparten una **plantilla corporativa parametrizada por skin**: cada
  usuario recibe los correos con la estética de **su skin activa** (paleta, tipografía y
  bordes traducidos a HTML email-safe en `src/lib/email/palettes.ts`).
  - Correos propios (Resend): **bienvenida** y **nueva amistad** → skin del destinatario.
  - Correo de **OTP** (lo envía GoTrue): una sola plantilla corporativa en la skin por
    defecto (Stick stack), porque en el alta aún no hay skin elegida y GoTrue no conoce
    la skin de cada usuario. *(Mejora futura opcional: Send Email Hook para per-skin.)*
- **Remitente** en producción: `Vibes <no-reply@vibes.oneman.es>` (dominio verificado en
  Resend; SMTP de GoTrue por Resend). En desarrollo se mantiene **Mailpit**.

## 5. Mapa de skins (técnico ↔ comercial)

| Técnico (`users.skin`) | Comercial |
| --- | --- |
| `neobrutalism` | Stick stack *(por defecto)* |
| `cyberbotanical` | La vie en rose |
| `flat design` | Speciality popcorn |
| `minimal` | Simple man |
| `pixel art` | PICO-8 pop |

## 6. Notas de despliegue (panel/infra, fuera del código)

- DNS de `vibes.oneman.es` verificado en Resend (SPF/DKIM). ✅
- Vercel: `EMAIL_FROM="Vibes <no-reply@vibes.oneman.es>"` + `RESEND_API_KEY`. ✅
- Supabase panel: Email OTP activado, contraseñas desactivadas, sesiones sin caducidad,
  SMTP por Resend con remitente no-reply. Replicar la plantilla `otp.html` (con
  `{{ .Token }}`) en Magic Link y Confirm signup, y `otp_expiry = 3600`.

## 7. Diagnóstico previo (heredado del intento de hotfix)

- Helper `logSupabaseError` (logs de Vercel) en las llamadas `.rpc()`/mutaciones.
- RPC `username_available` para dar error específico de username en el alta.

---

**Estado: Hecho** (código + build). Pendiente: pruebas e2e en producción y limpieza de
datos de prueba (ver informe final).
