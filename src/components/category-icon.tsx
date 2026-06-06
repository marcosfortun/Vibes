import {
  Bike,
  BookOpen,
  Camera,
  Castle,
  Clapperboard,
  Coffee,
  Compass,
  Dices,
  Drama,
  Film,
  Footprints,
  Gamepad2,
  Glasses,
  Guitar,
  Headphones,
  Image,
  Landmark,
  Map,
  MapPin,
  Mic,
  Mountain,
  MountainSnow,
  Music,
  Palette,
  PartyPopper,
  Podcast,
  Star,
  Tv,
  Utensils,
  Waves,
  Wine,
  type LucideIcon,
} from 'lucide-react';

// Whitelist de iconos disponibles para categorías. Mantener tree-shaking importando explícitamente.
// El admin escribe el nombre exacto (PascalCase) en categories.icon. Si no coincide, se renderiza
// el texto tal cual (compatibilidad con datos antiguos que tienen emoji).
const ICONS: Record<string, LucideIcon> = {
  Bike,
  BookOpen,
  Camera,
  Castle,
  Clapperboard,
  Coffee,
  Compass,
  Dices,
  Drama,
  Film,
  Footprints,
  Gamepad2,
  Glasses,
  Guitar,
  Headphones,
  Image,
  Landmark,
  Map,
  MapPin,
  Mic,
  Mountain,
  MountainSnow,
  Music,
  Palette,
  PartyPopper,
  Podcast,
  Star,
  Tv,
  Utensils,
  Waves,
  Wine,
};

export const CATEGORY_ICON_NAMES = Object.keys(ICONS);

export function CategoryIcon({
  name,
  className,
  size = 24,
}: {
  name?: string | null;
  className?: string;
  size?: number;
}) {
  if (!name) return null;
  const Icon = ICONS[name];
  if (Icon) {
    return <Icon className={className} size={size} strokeWidth={1.75} />;
  }
  // Fallback: texto/emoji (datos previos al cambio).
  return (
    <span className={className} style={{ fontSize: size }}>
      {name}
    </span>
  );
}
