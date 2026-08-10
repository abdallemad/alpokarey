import type { Metadata } from "next";
import { Suspense } from "react";

import { LessonsView } from "@/components/admin/lessons/lessons-view";
import {
  DataTableSkeleton,
  PageContainer,
  PageHeaderSkeleton,
} from "@/components/admin/shared";

export const metadata: Metadata = { title: "الدروس" };

/**
 * `/admin/lessons` — the lessons list.
 *
 * The view reads its filters from the URL with `useSearchParams`, which Next
 * requires to sit under a Suspense boundary.
 */
export default function AdminLessonsPage() {
  return (
    <PageContainer>
      <Suspense
        fallback={
          <>
            <PageHeaderSkeleton />
            <DataTableSkeleton columns={4} rows={10} />
          </>
        }
      >
        <LessonsView />
      </Suspense>
    </PageContainer>
  );
}
