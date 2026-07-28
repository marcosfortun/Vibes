// Piezas de skeleton reutilizadas por los loading.tsx. Imitan la forma real de
// cada elemento (fila de recomendación, fila de lista, campo…) para que la
// transición al contenido real no dé un salto visual. Los colores salen de las
// variables de la skin activa, así que se adaptan solas.

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

// Fila compacta de recomendación: icono + título + dos acciones circulares.
export function RecommendationRowSkeleton({ width = 'w-2/3' }: { width?: string }) {
  return (
    <div className="neon-border flex items-center gap-2.5 px-3 py-2">
      <SkeletonBlock className="h-5 w-5 shrink-0 rounded-full" />
      <SkeletonBlock className={`h-4 ${width}`} />
      <div className="ml-auto flex items-center gap-2.5">
        <SkeletonBlock className="h-8 w-8 shrink-0 rounded-full" />
        <SkeletonBlock className="h-8 w-8 shrink-0 rounded-full" />
      </div>
    </div>
  );
}

// Fila de las listas de ajustes/amigos (icono + texto + flechita).
export function ListRowSkeleton() {
  return (
    <div className="list-row">
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <SkeletonBlock className="h-5 w-5 shrink-0 rounded-full" />
        <SkeletonBlock className="h-4 w-1/2" />
      </span>
      <SkeletonBlock className="h-4 w-4 shrink-0" />
    </div>
  );
}

// Etiqueta + campo de formulario.
export function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="h-11 w-full rounded-xl" />
    </div>
  );
}

// Anchos variados para que la lista no parezca un patrón repetido.
export const ROW_WIDTHS = ['w-2/3', 'w-1/2', 'w-3/5', 'w-2/5', 'w-3/4', 'w-1/2'];
