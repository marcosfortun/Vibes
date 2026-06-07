// Plantilla HTML rígida para todos los correos de la app. Emula la interfaz:
// canvas negro mate, tarjeta #18181C con borde superior degradado neón, tipografía
// sans-serif, texto blanco/gris. Estilos en línea + tablas (compatibilidad email).

const PINK = '#ff2a75';
const GREEN = '#39ff85';
const CANVAS = '#000000';
const CARD = '#18181C';
const TEXT = '#FFFFFF';
const MUTED = '#A1A1AA';
const FONT = 'Inter, Helvetica, Arial, sans-serif';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Párrafo. Por defecto en gris (secundario); `strong` lo pone en blanco.
export function paragraph(html: string, opts?: { strong?: boolean }): string {
  const color = opts?.strong ? TEXT : MUTED;
  const weight = opts?.strong ? '600' : '400';
  return `<p style="margin:0 0 16px;color:${color};font-weight:${weight};font-size:15px;line-height:1.6;">${html}</p>`;
}

export function heading(text: string): string {
  return `<p style="margin:24px 0 12px;color:${TEXT};font-weight:700;font-size:16px;line-height:1.4;">${text}</p>`;
}

// Lista con viñetas neón.
export function bulletList(items: string[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="color:${GREEN};padding:0 10px 10px 0;vertical-align:top;font-size:15px;line-height:1.6;">&bull;</td><td style="color:${MUTED};padding:0 0 10px;font-size:15px;line-height:1.6;">${item}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${rows}</table>`;
}

// Botón principal: píldora con degradado rosa→verde y texto negro.
export function primaryButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;"><tr><td align="center" bgcolor="${PINK}" style="border-radius:9999px;background-color:${PINK};background-image:linear-gradient(90deg,${PINK},${GREEN});"><a href="${url}" target="_blank" style="display:inline-block;padding:13px 32px;font-family:${FONT};font-size:15px;font-weight:700;line-height:1;color:#000000;text-decoration:none;">${label}</a></td></tr></table>`;
}

// Botón secundario: píldora con borde y texto blanco.
export function outlineButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;"><tr><td align="center" style="border:1px solid rgba(255,255,255,0.35);border-radius:9999px;"><a href="${url}" target="_blank" style="display:inline-block;padding:12px 30px;font-family:${FONT};font-size:15px;font-weight:600;line-height:1;color:${TEXT};text-decoration:none;">${label}</a></td></tr></table>`;
}

// Firma final (despedida en gris + equipo en blanco).
export function signature(signoff: string, team: string): string {
  return `<p style="margin:28px 0 0;color:${MUTED};font-size:15px;line-height:1.6;">${signoff}<br><span style="color:${TEXT};font-weight:600;">${team}</span></p>`;
}

// Envuelve el contenido interno en el documento completo (canvas + card).
// logoUrl debe ser una URL ABSOLUTA (los emails no resuelven rutas relativas).
export function emailDocument(inner: string, lang = 'es', logoUrl?: string): string {
  const logoRow = logoUrl
    ? `<tr><td align="center" style="padding:28px 28px 4px;"><img src="${logoUrl}" alt="Vibes" width="150" style="display:block;width:150px;max-width:60%;height:auto;border:0;outline:none;text-decoration:none;" /></td></tr>`
    : '';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark only">
<meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CANVAS};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background-color:${CARD};border-radius:16px;overflow:hidden;">
<tr><td style="height:3px;line-height:3px;font-size:1px;background-color:${PINK};background-image:linear-gradient(90deg,${PINK},${GREEN});">&nbsp;</td></tr>
${logoRow}
<tr><td style="padding:${logoUrl ? '16px' : '32px'} 28px 32px;font-family:${FONT};color:${TEXT};">
${inner}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
