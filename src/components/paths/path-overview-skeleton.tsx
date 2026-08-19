import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The path page while it loads.
 *
 * Mirrors the real layout — the same two-column grid at `lg`, the same aside
 * width — rather than a centred spinner, so the content does not jump sideways
 * when it arrives. Used by both `loading.tsx` and the view's own pending
 * branch, so the server's first paint and the client's are the same picture.
 */
export function PathOverviewSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="space-y-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-4/5 max-w-2xl" />
        <div className="flex flex-wrap gap-4 pt-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-24" />
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-4">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
