'use client';

import { useEffect } from 'react';
import { updateSkin } from '@/lib/actions/preferences';
import { randomSkinStyle, type SkinStyle } from '@/lib/skins';
import { applySkin, readStoredSkin, storeSkin } from '@/lib/skin-client';

// Resuelve y persiste la skin tras la hidratación. El script de arranque del
// layout ya ha aplicado una skin antes del primer pintado (BD → localStorage →
// por defecto); aquí cerramos los casos que el script no puede resolver:
//
//   Con sesión:
//     - BD fijada            → es la fuente de verdad; se espeja a localStorage.
//     - BD null + localStorage → se adopta localStorage y se guarda en BD.
//     - BD null + sin local    → se elige una al azar y se guarda en BD y local.
//   Sin sesión:
//     - localStorage           → ya aplicada por el script.
//     - sin local              → se elige una al azar y se guarda en local.
export function SkinManager({
  dbSkin,
  loggedIn,
}: {
  dbSkin: SkinStyle | null;
  loggedIn: boolean;
}) {
  useEffect(() => {
    const stored = readStoredSkin();

    if (loggedIn) {
      if (dbSkin) {
        applySkin(dbSkin);
        storeSkin(dbSkin);
      } else if (stored) {
        applySkin(stored);
        void updateSkin(stored);
      } else {
        const random = randomSkinStyle();
        applySkin(random);
        storeSkin(random);
        void updateSkin(random);
      }
    } else if (stored) {
      applySkin(stored);
    } else {
      const random = randomSkinStyle();
      applySkin(random);
      storeSkin(random);
    }
  }, [dbSkin, loggedIn]);

  return null;
}
