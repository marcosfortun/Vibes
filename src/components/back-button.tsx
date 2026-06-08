import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Botón "volver" (style-guide §3.F): círculo 40px, fondo surface semi-transparente,
// borde muted y flecha blanca limpia.
export function BackButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link href={href} aria-label={label} className="back-button">
      <ArrowLeft size={18} strokeWidth={2} />
    </Link>
  );
}
