import type { Metadata } from "next";
import { Suspense } from "react";

import {
  DataTableSkeleton,
  PageContainer,
  PageHeaderSkeleton,
} from "@/components/admin/shared";
import { StagesView } from "@/components/admin/stages/stages-view";

export const metadata: Metadata = { title: "المراحل" };

/**
 * `/admin/stages` — every stage in the academy, grouped by its path.
 *
 * The view reads its filters from the URL with `useSearchParams`, which Next
 * requires to sit under a Suspense boundary.
 */
export default function AdminStagesPage() {
  return (
    <PageContainer>
      <Suspense
        fallback={
          <>
            <PageHeaderSkeleton withAction={false} />
            <DataTableSkeleton columns={4} rows={10} />
          </>
        }
      >
        <StagesView />
      </Suspense>
    </PageContainer>
  );
}
