import type { Metadata } from "next";

import { PathDetailView } from "@/components/admin/paths/path-detail-view";
import { PageContainer } from "@/components/admin/shared";

export const metadata: Metadata = { title: "تفاصيل المسار" };

/**
 * `/admin/paths/[pathId]` — one path in full: figures, its stages, and the
 * edit form.
 *
 * The page only unwraps the route param; the data is fetched client-side
 * through the React Query hook so a save re-renders from cache without a full
 * navigation.
 */
export default async function AdminPathDetailPage({
  params,
}: PageProps<"/admin/paths/[pathId]">) {
  const { pathId } = await params;

  return (
    <PageContainer>
      <PathDetailView pathId={pathId} />
    </PageContainer>
  );
}
