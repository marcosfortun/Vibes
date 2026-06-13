'use client';

import { DEFAULT_SKIN, skinFor } from '@/lib/skins';
import { useActiveSkin } from '@/lib/use-active-skin';

// Logo de Vibes que se adapta a la skin activa (neón en cyberbotanical, sobrio
// en minimal). Se usa en las pantallas con logo (login, alta, invitación).
export function BrandLogo({
  className,
  alt = 'Vibes',
}: {
  className?: string;
  alt?: string;
}) {
  const skin = useActiveSkin(DEFAULT_SKIN);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={skinFor(skin).logo} alt={alt} className={className} />;
}
