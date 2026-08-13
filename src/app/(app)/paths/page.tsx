import { Suspense } from "react";
import type { Metadata } from "next";

import { MyPathsView } from "@/components/app/paths/my-paths-view";
import { MyPathsSkeleton } from "@/components/app/paths/my-paths-skeleton";
import { PageContainer } from "@/components/shared";

export const metadata: Metadata = { title: "مساراتي" };

/**
 * `/paths` — the learner's own paths.
 *
 * A thin Server Component, like `/dashboard`: the data is fetched client-side
 * through React Query so finishing a lesson can refresh these figures from
 * cache without a full navigation, once the player lands.
 *
 * The `<Suspense>` boundary is required, not decorative — `MyPathsView` reads
 * `useSearchParams()` to keep its filters in the URL, and Next.js opts any
 * component that does so out of prerendering unless it sits inside one.
 */
export default function MyPathsPage() {
  return (
    <PageContainer>
      <Suspense fallback={<MyPathsSkeleton />}>
        <MyPathsView />
      </Suspense>
    </PageContainer>
  );
}
