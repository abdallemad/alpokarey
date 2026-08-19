import { PublicPathCardSkeleton } from "@/components/paths/public-path-card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The catalog while it loads.
 *
 * Mirrors the real page — centred heading block, the filter row, then the same
 * 3×3 grid — rather than a spinner, so nothing shifts when the cards arrive.
 * Shown by `loading.tsx`, by the page's `<Suspense>` boundary and by the view's
 * own pending branch, so all three paints are the same picture.
 *
 * Only on the **first** load: once there are cards, `keepPreviousData` holds
 * them on screen and a page change dims the grid instead of replacing it.
 */
export function PathsCatalogSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <Skeleton className="mx-auto h-4 w-20" />
        <Skeleton className="mx-auto h-9 w-64" />
        <Skeleton className="mx-auto h-4 w-full max-w-xl" />
      </div>

      <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Skeleton className="h-8 w-full lg:max-w-xs" />
        <div className="flex flex-wrap gap-2 lg:ms-auto">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-7 w-40" />
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <PublicPathCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
