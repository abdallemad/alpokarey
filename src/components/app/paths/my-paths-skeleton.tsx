import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The `/paths` placeholder, shaped like the real page — header, four figures,
 * the filter bar, then the card grid — so nothing shifts when data arrives.
 *
 * Deliberately not defined inside `my-paths-view.tsx`: `loading.tsx` and the
 * page's `<Suspense>` fallback both render it, and neither should have to pull
 * a client bundle in to show a placeholder.
 */
export function MyPathsSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Skeleton className="h-8 w-full lg:max-w-xs" />
            <div className="flex flex-wrap gap-2 lg:ms-auto">
              <Skeleton className="h-7 w-36 rounded-md" />
              <Skeleton className="h-7 w-36 rounded-md" />
              <Skeleton className="h-7 w-40 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Card key={index}>
                <CardContent className="space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-1 w-full" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
