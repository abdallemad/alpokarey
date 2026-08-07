import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading placeholders for the admin console.
 *
 * Each one mirrors the shape of the real UI it stands in for — same heights,
 * same grid, same paddings — so nothing shifts when the content swaps in.
 */

export function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {withAction ? <Skeleton className="h-8 w-32 rounded-lg" /> : null}
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
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
  );
}

export function DataTableSkeleton({
  rows = 6,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        {/* Toolbar: search field on one end, filters on the other. */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-full max-w-64 rounded-lg" />
          <Skeleton className="ms-auto h-8 w-24 rounded-lg" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-0">
        <div className="border-y border-border px-4 py-2.5">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }, (_, index) => (
              <Skeleton key={index} className="h-4 w-20" />
            ))}
          </div>
        </div>

        <div className="space-y-3 px-4">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: columns }, (_, columnIndex) => (
                <Skeleton
                  key={columnIndex}
                  className={cn("h-4", columnIndex === 0 ? "w-full" : "w-2/3")}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
