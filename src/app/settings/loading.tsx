import { ListRowSkeleton, SkeletonBlock } from '@/components/skeletons';

// Ajustes: título + usuario + botonera de opciones.
export default function SettingsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-4 w-28" />
      </div>
      <nav className="flex flex-col gap-3 border-t border-border-muted pt-5">
        {[0, 1, 2, 3].map((i) => (
          <ListRowSkeleton key={i} />
        ))}
      </nav>
    </main>
  );
}
