import { ListRowSkeleton, SkeletonBlock } from '@/components/skeletons';

// Amigos: cabecera con volver + enlace de invitación + lista de amigos.
export default function FriendsLoading() {
  return (
    <main className="mx-auto -mb-28 flex h-[100dvh] w-full max-w-md flex-col gap-4 overflow-hidden px-6 pt-6">
      <header className="page-header shrink-0">
        <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
        <SkeletonBlock className="h-7 w-32" />
      </header>
      <SkeletonBlock className="h-20 w-full shrink-0 rounded-xl" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
