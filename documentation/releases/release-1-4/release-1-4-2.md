# Hotfix release 1.4.2 — Correcciones de las pruebas en producción de la 1.4.0

Hotfix sobre la rama `hotfix/1.4.2`. Recoge los fallos encontrados al probar la
1.4.0 en producción y las correcciones aplicadas.

## Correcciones

1. **Autocompletado externo (TMDB/Steam/IA) no devolvía resultados.** Causa raíz:
   la tabla `category_providers` no se sembraba en ninguna migración (la de
   `providers` solo creaba el catálogo), así que en producción estaba vacía y
   ninguna categoría tenía proveedores. Añadida migración
   `20260616120000_seed_category_providers.sql` (idempotente): TMDB→cine/series/
   documental, Steam→videojuego/VR, IA→fallback universal. Además, en local faltaba
   `TMDB_API_KEY` (añadida a `.env.local`; en prod va en Vercel).
   *Verificado en local: TMDB devuelve resultados en el alta.*

2. **OTP ampliado a 8 dígitos** (`otp_length=8` en `config.toml`, `maxLength` en los
   formularios y cadena i18n `codeLabel`). *Verificado en local.*

3. **Rate limits** anti-spam y anti-fuerza bruta (`config.toml`): `max_frequency=60s`
   entre OTPs por usuario, `email_sent=10/h`, `token_verifications=30`. Replicar en
   el panel de prod (Authentication > Rate Limits).

4. **Correo de bienvenida (skin PICO-8 pop): botón y tipografía.** El botón CTA salía
   redondeado (no seguía la skin) y la tipografía monospace no se aplicaba: estaba
   definida con comillas dobles, que **rompían el atributo `style="…"`** y anulaban
   las reglas siguientes (text-decoration, color, fuente). Corregido con comillas
   simples y `btnRadius` por skin (pixel art recto, neón píldora). *Verificado: el
   correo se renderiza en monospace, botón recto, sin subrayado.*

5. **Logo del OTP no cargaba (Stick stack).** `otp.html` usaba `{{ .SiteURL }}`; se
   fija la URL absoluta del logo de producción.

6/7. **OTP con skin e idioma del usuario.** Implementado vía **Send Email Hook**
   (Edge Function `supabase/functions/send-email`): renderiza el OTP en la skin
   (login: de BD; alta: por defecto) e idioma del usuario, con logo absoluto, y lo
   envía por Resend (esquiva el 550 del SMTP de GoTrue). **Queda deshabilitado**
   (`[auth.hook.send_email].enabled=false`): activarlo enruta todo el OTP por la
   función, así que requiere verificación previa y, en prod, habilitar el hook +
   secreto en el panel y desplegar la función. *Pendiente de verificación conjunta.*

8. **Correos de nueva amistad no llegaban (prod).** El de bienvenida llega (usa la
   sesión del usuario), pero el de amistad necesita el **cliente service-role**
   (`createAdminClient`) para leer el email oculto del anfitrión. Si
   `SUPABASE_SERVICE_ROLE_KEY` no está en Vercel, lanza, se captura y la amistad se
   crea **sin enviar correos**. El código es correcto y falla de forma segura;
   **acción: configurar `SUPABASE_SERVICE_ROLE_KEY` en Vercel.**

9. **README** actualizado (acceso sin contraseñas, identidad camaleón, variables
   `TMDB_API_KEY`/`ANTHROPIC_API_KEY`).

## Pendiente de acción del usuario (prod, fuera del código)

- **Vercel env**: `TMDB_API_KEY`, `ANTHROPIC_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
- **Supabase panel**: `otp_length=8`, `otp_expiry=3600`, rate limits, y el remitente
  SMTP verificado (el 550 de Resend sigue pendiente: el dominio del *Sender* del SMTP
  debe coincidir con el verificado en Resend).
- **Send Email Hook**: verificar en local, desplegar la función y habilitar el hook +
  secreto en el panel.
- **Desplegar la migración** `20260616120000_seed_category_providers.sql` al hacer el
  deploy de 1.4.2.
