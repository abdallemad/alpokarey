"use client";

import * as React from "react";

import { LearnHeader } from "@/components/app/learn/learn-header";
import { LearnSidebar } from "@/components/app/learn/learn-sidebar";
import { LearnShellSkeleton } from "@/components/app/learn/learn-skeletons";
import { ApiErrorState } from "@/components/shared";
import { SidebarInset } from "@/components/ui/sidebar";
import { useCurriculum } from "@/hooks/use-curriculum";

/**
 * The player shell: the curriculum in the sidebar, the lesson in the inset.
 *
 * It owns the curriculum request for the whole player. Because a Next layout
 * does not unmount as its children change, the tree is fetched once when the
 * learner enters a path rather than once per lesson — and the pages inside read
 * the same cached copy through `useCurriculum` for their prev/next buttons.
 *
 * Rendered by `(learn)/learn/[pathId]/layout.tsx`, inside the
 * `SidebarProvider` that route group's layout sets up. It is a Client
 * Component because everything it renders depends on a request the learner's
 * own session answers.
 *
 * A failure here replaces the page rather than sitting beside it: every screen
 * inside is gated on the same enrolment, so showing the lesson's copy of the
 * same error underneath would just say it twice. The header stays in both the
 * loading and the failed state, because a learner who cannot open a path still
 * needs a way out of it.
 */
export function LearnShell({
  pathId,
  children,
}: {
  pathId: string;
  children: React.ReactNode;
}) {
  const { data, isPending, isError, error, refetch } = useCurriculum(pathId);

  if (isPending) {
    return <LearnShellSkeleton />;
  }

  if (isError) {
    return (
      <SidebarInset className="min-w-0">
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <ApiErrorState
            error={error}
            title="تعذّر تحميل محتوى المسار"
            onRetry={() => refetch()}
          />
        </div>
      </SidebarInset>
    );
  }

  return (
    <>
      <LearnSidebar curriculum={data} />

      <SidebarInset className="min-w-0">
        <LearnHeader curriculum={data} />

        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </>
  );
}
