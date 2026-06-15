import type { SkinStyle } from '@/lib/skins';

// Paleta de correo por skin. Es una traducción "email-safe" (colores sólidos,
// sin variables CSS ni blur) de los bloques [data-skin] de globals.css, para que
// cada usuario reciba los correos con la estética de su skin activa.
export type EmailPalette = {
  canvas: string; // fondo de la página
  card: string; // fondo de la tarjeta
  text: string; // texto principal
  muted: string; // texto secundario
  pink: string; // acento primario
  green: string; // acento secundario
  btnBg: string; // color sólido del botón principal
  btnGradient: string | null; // degradado opcional (clientes que lo soporten)
  btnFg: string; // texto del botón principal
  font: string; // familia tipográfica
  radius: number; // radio de la tarjeta (px)
  border: string; // color del borde de la tarjeta
  borderWidth: number; // grosor del borde (px); 0 = sin borde, barra superior
  bar: string | null; // barra superior decorativa (degradado) o null
};

const SANS = 'Inter, Helvetica, Arial, sans-serif';
const MONO = '"Courier New", Consolas, Menlo, monospace';

export const EMAIL_PALETTES: Record<SkinStyle, EmailPalette> = {
  cyberbotanical: {
    canvas: '#000000',
    card: '#18181C',
    text: '#FFFFFF',
    muted: '#8E8E93',
    pink: '#ff2a75',
    green: '#39ff85',
    btnBg: '#ff2a75',
    btnGradient: 'linear-gradient(90deg,#ff2a75,#39ff85)',
    btnFg: '#000000',
    font: SANS,
    radius: 16,
    border: '#18181C',
    borderWidth: 0,
    bar: 'linear-gradient(90deg,#ff2a75,#39ff85)',
  },
  minimal: {
    canvas: '#f4f4f6',
    card: '#ffffff',
    text: '#1b1b1f',
    muted: '#70707a',
    pink: '#d6336c',
    green: '#2f9e6b',
    btnBg: '#1b1b1f',
    btnGradient: null,
    btnFg: '#ffffff',
    font: SANS,
    radius: 16,
    border: 'rgba(0,0,0,0.12)',
    borderWidth: 1,
    bar: null,
  },
  'flat design': {
    canvas: '#eef1f8',
    card: '#ffffff',
    text: '#17257d',
    muted: '#6b7390',
    pink: '#fe675c',
    green: '#17257d',
    btnBg: '#fe675c',
    btnGradient: null,
    btnFg: '#ffffff',
    font: SANS,
    radius: 14,
    border: 'rgba(23,37,125,0.18)',
    borderWidth: 1,
    bar: null,
  },
  neobrutalism: {
    canvas: '#fdf7e3',
    card: '#ffffff',
    text: '#111111',
    muted: '#5a5a5a',
    pink: '#bc2a95',
    green: '#8fcb04',
    btnBg: '#b3fe05',
    btnGradient: null,
    btnFg: '#111111',
    font: SANS,
    radius: 4,
    border: '#111111',
    borderWidth: 3,
    bar: null,
  },
  'pixel art': {
    canvas: '#1b2e2e',
    card: '#2e4f4f',
    text: '#fff4c2',
    muted: '#8fb0aa',
    pink: '#ffd700',
    green: '#5fd6b6',
    btnBg: '#ffd700',
    btnGradient: null,
    btnFg: '#1b2e2e',
    font: MONO,
    radius: 0,
    border: '#ffd700',
    borderWidth: 2,
    bar: null,
  },
};
