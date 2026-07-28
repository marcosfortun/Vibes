import {
  RecommendationRowSkeleton,
  ROW_WIDTHS,
  SkeletonBlock,
} from '@/components/skeletons';

// Home: tablist + lista de recomendaciones compactas.
export default function HomeLoading() {
  return (
    <div className="w-full">
      <div className="w-full pt-3">
        <div className="mx-auto flex max-w-2xl gap-2 px-4 pb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 px-2">
              <SkeletonBlock className="mx-auto h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-2xl px-5">
        <ul className="flex flex-col gap-2 pb-5 pt-1">
          {ROW_WIDTHS.map((w, i) => (
            <li key={i}>
              <RecommendationRowSkeleton width={w} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
