import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Botón "volver" estilo iconos de tarjeta: círculo cian neón con flecha.
// Misma proporción/aspecto que el botón "⋯" de RecommendationCard.
export function BackButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-current text-white opacity-70 transition-opacity hover:opacity-100"
    >
      <ArrowLeft size={18} strokeWidth={2} />
    </Link>
  );
}
