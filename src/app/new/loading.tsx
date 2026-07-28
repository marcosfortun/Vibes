import { FieldSkeleton, SkeletonBlock } from '@/components/skeletons';

// Alta: título + enlace a carga masiva + buscador de categoría.
export default function NewLoading() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-2">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-4 w-24" />
      </div>
      <FieldSkeleton />
    </main>
  );
}
