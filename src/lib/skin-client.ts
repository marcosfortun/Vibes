// Helpers de cliente para la skin: persistencia en localStorage (sobrevive al
// logout) y aplicación del atributo data-skin en <html>. Solo deben llamarse en
// el navegador (los guardamos con try/catch por si localStorage no está disponible).
import { isSkinStyle, SKIN_STORAGE_KEY, type SkinStyle } from './skins';

export { SKIN_STORAGE_KEY };

export function readStoredSkin(): SkinStyle | null {
  try {
    const v = localStorage.getItem(SKIN_STORAGE_KEY);
    return isSkinStyle(v) ? v : null;
  } catch {
    return null;
  }
}

export function storeSkin(style: SkinStyle): void {
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, style);
  } catch {
    // Ignorar (modo privado, cuota, etc.).
  }
}

export function applySkin(style: SkinStyle): void {
  document.documentElement.dataset.skin = style;
}
