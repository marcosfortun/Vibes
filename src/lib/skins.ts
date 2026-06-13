// Catálogo de skins de la interfaz.
//
// Cada skin tiene dos campos:
//   - style: nombre técnico. Es lo que se guarda en `users.skin` y se aplica como
//     atributo `data-skin` en <html>. Debe coincidir con los bloques de variables
//     CSS de globals.css y con el CHECK de la migración.
//   - name:  nombre comercial mostrado al usuario en el selector.
//
// Al añadir una skin nueva: agregarla aquí, añadir su bloque [data-skin="..."] en
// globals.css y ampliar el CHECK `users_skin_valid` en una migración.

export type SkinStyle =
  | 'cyberbotanical'
  | 'minimal'
  | 'flat design'
  | 'neobrutalism'
  | 'pixel art';

export type Skin = {
  style: SkinStyle;
  name: string;
  // Assets de marca adaptados al estilo de la skin (en /public).
  icon: string;
  logo: string;
};

export const SKINS: readonly Skin[] = [
  {
    style: 'cyberbotanical',
    name: 'La vie en rose',
    icon: '/icon.jpg',
    logo: '/logo.jpg',
  },
  {
    style: 'minimal',
    name: 'Simple man',
    icon: '/icon-minimal.png',
    logo: '/logo-minimal.png',
  },
  {
    style: 'flat design',
    name: 'Speciality popcorn',
    icon: '/icon-flat.png',
    logo: '/logo-flat.png',
  },
  {
    style: 'neobrutalism',
    name: 'Stick stack',
    icon: '/icon-neobrutalism.png',
    logo: '/logo-neobrutalism.png',
  },
  {
    style: 'pixel art',
    name: 'PICO-8 pop',
    icon: '/icon-pixel.png',
    logo: '/logo-pixel.png',
  },
] as const;

export function skinFor(style: SkinStyle): Skin {
  return SKINS.find((s) => s.style === style) ?? SKINS[0];
}

export const DEFAULT_SKIN: SkinStyle = 'cyberbotanical';

// Clave de localStorage donde se persiste la skin (sobrevive al logout).
export const SKIN_STORAGE_KEY = 'vibes-skin';

export function isSkinStyle(value: unknown): value is SkinStyle {
  return SKINS.some((s) => s.style === value);
}

// Elige una skin al azar (se usa cuando el usuario no tiene ninguna fijada).
export function randomSkinStyle(): SkinStyle {
  return SKINS[Math.floor(Math.random() * SKINS.length)].style;
}

// Normaliza un valor arbitrario (p. ej. de BD) a una skin válida.
export function toSkinStyle(value: unknown): SkinStyle {
  return isSkinStyle(value) ? value : DEFAULT_SKIN;
}
