// Plantilla HTML de los correos de la app, parametrizada por skin. Emula la
// interfaz de cada estilo (canvas, tarjeta, acentos, tipografía y bordes).
// Estilos en línea + tablas para máxima compatibilidad entre clientes de correo.
import type { EmailPalette } from './palettes';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Párrafo. Por defecto en color secundario; `strong` lo pone en el principal.
export function paragraph(
  p: EmailPalette,
  html: string,
  opts?: { strong?: boolean },
): string {
  const color = opts?.strong ? p.text : p.muted;
  const weight = opts?.strong ? '600' : '400';
  return `<p style="margin:0 0 16px;color:${color};font-weight:${weight};font-size:15px;line-height:1.6;">${html}</p>`;
}

export function heading(p: EmailPalette, text: string): string {
  return `<p style="margin:24px 0 12px;color:${p.text};font-weight:700;font-size:16px;line-height:1.4;">${text}</p>`;
}

// Lista con viñetas en el acento secundario.
export function bulletList(p: EmailPalette, items: string[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="color:${p.green};padding:0 10px 10px 0;vertical-align:top;font-size:15px;line-height:1.6;">&bull;</td><td style="color:${p.muted};padding:0 0 10px;font-size:15px;line-height:1.6;">${item}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${rows}</table>`;
}

// Bloque destacado para el código OTP (números grandes y monoespaciados).
export function codeBlock(p: EmailPalette, code: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td align="center" style="border:${p.borderWidth || 1}px solid ${p.border};border-radius:${p.radius}px;background-color:${p.canvas};padding:16px 28px;"><span style="font-family:'Courier New',Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:${p.text};">${code}</span></td></tr></table>`;
}

// Botón principal: píldora (o rectángulo según el radio de la skin).
export function primaryButton(p: EmailPalette, label: string, url: string): string {
  const radius = Math.max(p.radius, 6);
  const bg = p.btnGradient
    ? `background-color:${p.btnBg};background-image:${p.btnGradient};`
    : `background-color:${p.btnBg};`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;"><tr><td align="center" bgcolor="${p.btnBg}" style="border-radius:${radius}px;${bg}"><a href="${url}" target="_blank" style="display:inline-block;padding:13px 32px;font-family:${p.font};font-size:15px;font-weight:700;line-height:1;color:${p.btnFg};text-decoration:none;">${label}</a></td></tr></table>`;
}

// Botón secundario: borde + texto principal.
export function outlineButton(p: EmailPalette, label: string, url: string): string {
  const radius = Math.max(p.radius, 6);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;"><tr><td align="center" style="border:1px solid ${p.text};border-radius:${radius}px;"><a href="${url}" target="_blank" style="display:inline-block;padding:12px 30px;font-family:${p.font};font-size:15px;font-weight:600;line-height:1;color:${p.text};text-decoration:none;">${label}</a></td></tr></table>`;
}

// Firma final (despedida + equipo).
export function signature(p: EmailPalette, signoff: string, team: string): string {
  return `<p style="margin:28px 0 0;color:${p.muted};font-size:15px;line-height:1.6;">${signoff}<br><span style="color:${p.text};font-weight:600;">${team}</span></p>`;
}

// Envuelve el contenido en el documento completo (canvas + tarjeta) de la skin.
// logoUrl debe ser una URL ABSOLUTA (los correos no resuelven rutas relativas).
export function emailDocument(
  p: EmailPalette,
  inner: string,
  lang = 'es',
  logoUrl?: string,
): string {
  const barRow = p.bar
    ? `<tr><td style="height:3px;line-height:3px;font-size:1px;background-color:${p.pink};background-image:${p.bar};">&nbsp;</td></tr>`
    : '';
  const cardBorder = p.borderWidth > 0 ? `border:${p.borderWidth}px solid ${p.border};` : '';
  const logoRow = logoUrl
    ? `<tr><td align="center" style="padding:28px 28px 4px;"><img src="${logoUrl}" alt="Vibes" width="150" style="display:block;width:150px;max-width:60%;height:auto;border:0;outline:none;text-decoration:none;" /></td></tr>`
    : '';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:${p.canvas};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${p.canvas};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background-color:${p.card};border-radius:${p.radius}px;overflow:hidden;${cardBorder}">
${barRow}
${logoRow}
<tr><td style="padding:${logoUrl ? '16px' : '32px'} 28px 32px;font-family:${p.font};color:${p.text};">
${inner}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
