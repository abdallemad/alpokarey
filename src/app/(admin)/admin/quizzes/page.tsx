import type { Metadata } from "next";
import { Suspense } from "react";

import { QuizzesView } from "@/components/admin/quizzes/quizzes-view";
import {
  DataTableSkeleton,
  PageContainer,
  PageHeaderSkeleton,
} from "@/components/admin/shared";

export const metadata: Metadata = { title: "الاختبارات" };

/**
 * `/admin/quizzes` — every exam in the academy, final and lesson-linked.
 *
 * The view reads its filters from the URL with `useSearchParams`, which Next
 * requires to sit under a Suspense boundary.
 */
export default function AdminQuizzesPage() {
  return (
    <PageContainer>
      <Suspense
        fallback={
          <>
            <PageHeaderSkeleton />
            <DataTableSkeleton columns={5} rows={10} />
          </>
        }
      >
        <QuizzesView />
      </Suspense>
    </PageContainer>
  );
}
