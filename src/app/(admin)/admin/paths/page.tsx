import type { Metadata } from "next";
import { Suspense } from "react";

import { PathsView } from "@/components/admin/paths/paths-view";
import {
  DataTableSkeleton,
  PageContainer,
  PageHeaderSkeleton,
} from "@/components/admin/shared";

export const metadata: Metadata = { title: "المسارات" };

/**
 * `/admin/paths` — the paths list.
 *
 * The view reads its filters from the URL with `useSearchParams`, which Next
 * requires to sit under a Suspense boundary.
 */
export default function AdminPathsPage() {
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
        <PathsView />
      </Suspense>
    </PageContainer>
  );
}
