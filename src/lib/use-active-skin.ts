'use client';

import { useSyncExternalStore } from 'react';
import { isSkinStyle, type SkinStyle } from './skins';

// Observa el atributo data-skin de <html> (lo fijan el script de arranque,
// SkinManager y el selector) y devuelve la skin activa, reactiva a sus cambios.
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-skin'],
  });
  return () => observer.disconnect();
}

export function useActiveSkin(fallback: SkinStyle): SkinStyle {
  return useSyncExternalStore(
    subscribe,
    () => {
      const v = document.documentElement.dataset.skin;
      return isSkinStyle(v) ? v : fallback;
    },
    () => fallback,
  );
}
