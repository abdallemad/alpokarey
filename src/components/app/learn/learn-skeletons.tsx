import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholders shaped like the screens they stand in for, so nothing jumps when
 * the data lands.
 *
 * Kept out of the view files for the same reason as `MyPathsSkeleton`:
 * `loading.tsx` renders them on the server, and a placeholder should not pull a
 * client bundle in behind it.
 */

/**
 * The whole player: the curriculum sidebar and the content beside it.
 *
 * It renders the **real** `Sidebar` and `SidebarInset` rather than a pair of
 * plain divs. Those two primitives are what reserve the sidebar's width, so a
 * flat placeholder would paint the lesson full-bleed and then shove it sideways
 * the moment the curriculum arrived. Both are safe here: the `SidebarProvider`
 * they read is up in `(learn)/layout.tsx`, above every route that shows this.
 */
export function LearnShellSkeleton() {
  return (
    <>
      <Sidebar side="right" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="gap-3 p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-1.5 w-full" />
        </SidebarHeader>

        <SidebarSeparator className="mx-0" />

        <SidebarContent className="gap-3 p-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-full rounded-md" />
              <Skeleton className="h-6 w-full rounded-md" />
            </div>
          ))}
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 md:px-4">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="ms-auto h-8 w-28 rounded-lg" />
        </header>

        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
          <LessonViewSkeleton />
        </div>
      </SidebarInset>
    </>
  );
}

/** One lesson: the player frame, the title block, then the tabs. */
export function LessonViewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-video w-full rounded-xl" />

      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-6 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
      </Card>
    </div>
  );
}

/** One exam, before it is known whether it opens on the intro or a result. */
export function QuizViewSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-8 w-40 rounded-lg" />
      </CardContent>
    </Card>
  );
}
