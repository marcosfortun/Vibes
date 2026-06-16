// Supabase Auth "Send Email" Hook (Edge Function, Deno).
//
// Renderiza y envía los correos de GoTrue (OTP de login/alta) con la MISMA
// estética camaleón que el resto: en la skin y el idioma del usuario. Resuelve:
//   - OTP en la skin del usuario (login: skin de BD; alta: skin por defecto).
//   - OTP en el idioma del usuario (users.language; fallback navegador→'en').
//   - Logo absoluto (no depende de {{ .SiteURL }} del panel).
// Y como se envía por la API de Resend, esquiva el 550 del SMTP de GoTrue.
//
// Habilitación: ver [auth.hook.send_email] en supabase/config.toml (local) y el
// panel (Authentication > Hooks) en prod. Requiere el secreto del hook.
//
// Es autocontenida (Deno no puede importar el código Node de src/): las paletas y
// los textos i18n del OTP se replican aquí a propósito; si cambian en la app,
// actualizar también este fichero.

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

type Skin =
  | 'cyberbotanical'
  | 'minimal'
  | 'flat design'
  | 'neobrutalism'
  | 'pixel art';

const DEFAULT_SKIN: Skin = 'neobrutalism';
const SANS = 'Inter, Helvetica, Arial, sans-serif';
const MONO = "'Courier New', Consolas, Menlo, monospace";

type Palette = {
  canvas: string; card: string; text: string; muted: string;
  border: string; borderWidth: number; radius: number; font: string;
  logo: string; // ruta del logo de la skin
};

const SITE = Deno.env.get('SITE_URL') ?? 'https://vibes.oneman.es';

const PALETTES: Record<Skin, Palette> = {
  cyberbotanical: { canvas: '#000000', card: '#18181C', text: '#FFFFFF', muted: '#8E8E93', border: '#18181C', borderWidth: 0, radius: 16, font: SANS, logo: '/logo.jpg' },
  minimal: { canvas: '#f4f4f6', card: '#ffffff', text: '#1b1b1f', muted: '#70707a', border: 'rgba(0,0,0,0.12)', borderWidth: 1, radius: 16, font: SANS, logo: '/logo-minimal.png' },
  'flat design': { canvas: '#eef1f8', card: '#ffffff', text: '#17257d', muted: '#6b7390', border: 'rgba(23,37,125,0.18)', borderWidth: 1, radius: 14, font: SANS, logo: '/logo-flat.png' },
  neobrutalism: { canvas: '#fdf7e3', card: '#ffffff', text: '#111111', muted: '#5a5a5a', border: '#111111', borderWidth: 3, radius: 4, font: SANS, logo: '/logo-neobrutalism.png' },
  'pixel art': { canvas: '#1b2e2e', card: '#2e4f4f', text: '#fff4c2', muted: '#8fb0aa', border: '#ffd700', borderWidth: 2, radius: 0, font: MONO, logo: '/logo-pixel.png' },
};

type Lang = 'en' | 'es' | 'fr' | 'pt';
const I18N: Record<Lang, { subject: string; title: string; intro: string; expiry: string; ignore: string; signoff: string; team: string }> = {
  es: { subject: 'Tu código de acceso a Vibes ⚡', title: 'Tu código de acceso a Vibes', intro: 'Introduce este código de un solo uso para entrar.', expiry: 'Caduca en 1 hora.', ignore: 'Si no has solicitado este código, ignora este correo.', signoff: 'Buenas vibras,', team: 'El equipo de Vibes' },
  en: { subject: 'Your Vibes access code ⚡', title: 'Your Vibes access code', intro: 'Enter this one-time code to sign in.', expiry: 'It expires in 1 hour.', ignore: "If you didn't request this code, you can ignore this email.", signoff: 'Good vibes,', team: 'The Vibes team' },
  fr: { subject: "Ton code d'accès à Vibes ⚡", title: "Ton code d'accès à Vibes", intro: 'Saisis ce code à usage unique pour te connecter.', expiry: 'Il expire dans 1 heure.', ignore: "Si tu n'as pas demandé ce code, ignore cet e-mail.", signoff: 'Bonnes vibes,', team: "L'équipe Vibes" },
  pt: { subject: 'Seu código de acesso ao Vibes ⚡', title: 'Seu código de acesso ao Vibes', intro: 'Digite este código de uso único para entrar.', expiry: 'Expira em 1 hora.', ignore: 'Se você não solicitou este código, ignore este e-mail.', signoff: 'Boas vibrações,', team: 'A equipe Vibes' },
};

function renderOtpEmail(code: string, skin: Skin, lang: Lang): string {
  const p = PALETTES[skin];
  const t = I18N[lang];
  const cardBorder = p.borderWidth > 0 ? `border:${p.borderWidth}px solid ${p.border};` : '';
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:${p.canvas};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${p.canvas};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background-color:${p.card};border-radius:${p.radius}px;overflow:hidden;${cardBorder}">
<tr><td align="center" style="padding:28px 28px 4px;"><img src="${SITE}${p.logo}" alt="Vibes" width="150" style="display:block;width:150px;max-width:60%;height:auto;border:0;"></td></tr>
<tr><td style="padding:16px 28px 32px;font-family:${p.font};color:${p.text};">
<p style="margin:0 0 16px;color:${p.text};font-weight:600;font-size:15px;line-height:1.6;">${t.title}</p>
<p style="margin:0 0 16px;color:${p.muted};font-size:15px;line-height:1.6;">${t.intro} ${t.expiry}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td align="center" style="border:${p.borderWidth || 1}px solid ${p.border};border-radius:${p.radius}px;background-color:${p.canvas};padding:16px 28px;"><span style="font-family:${MONO};font-size:34px;font-weight:700;letter-spacing:10px;color:${p.text};">${code}</span></td></tr></table>
<p style="margin:24px 0 0;color:${p.muted};font-size:13px;line-height:1.6;">${t.ignore}</p>
<p style="margin:24px 0 0;color:${p.muted};font-size:15px;line-height:1.6;">${t.signoff}<br><span style="color:${p.text};font-weight:600;">${t.team}</span></p>
</td></tr></table></td></tr></table></body></html>`;
}

// Lee skin + idioma del perfil (service role, bypassa RLS).
async function getProfile(userId: string): Promise<{ skin: Skin; lang: Lang }> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  let skin: Skin = DEFAULT_SKIN;
  let lang: Lang = 'en';
  try {
    const res = await fetch(`${url}/rest/v1/users?id=eq.${userId}&select=skin,language`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}` },
    });
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (row?.skin && row.skin in PALETTES) skin = row.skin as Skin;
    if (row?.language && ['en', 'es', 'fr', 'pt'].includes(row.language)) lang = row.language as Lang;
  } catch (_) { /* defaults */ }
  return { skin, lang };
}

async function deliver(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') ?? 'Vibes <no-reply@vibes.oneman.es>';
  if (apiKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
  } else {
    // Local: Mailpit. Desde el contenedor edge, el host de Mailpit es el del CLI.
    const mailpit = Deno.env.get('MAILPIT_API_URL') ?? 'http://host.docker.internal:54324';
    const m = from.match(/^(.+?)\s*<(.+?)>$/);
    await fetch(`${mailpit}/api/v1/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ From: { Name: m ? m[1].trim() : 'Vibes', Email: m ? m[2] : from }, To: [{ Email: to }], Subject: subject, HTML: html }),
    });
  }
}

Deno.serve(async (req) => {
  const payload = await req.text();
  const secret = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
  let data: { user: { id: string; email: string }; email_data: { token: string } };
  try {
    if (secret) {
      const wh = new Webhook(secret.replace('v1,whsec_', '').replace('whsec_', ''));
      data = wh.verify(payload, Object.fromEntries(req.headers)) as typeof data;
    } else {
      data = JSON.parse(payload);
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: `invalid signature: ${e}` }), { status: 401 });
  }

  const { user, email_data } = data;
  const { skin, lang } = await getProfile(user.id);
  const t = I18N[lang];
  try {
    await deliver(user.email, t.subject, renderOtpEmail(email_data.token, skin, lang));
  } catch (e) {
    return new Response(JSON.stringify({ error: `send failed: ${e}` }), { status: 500 });
  }
  return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
