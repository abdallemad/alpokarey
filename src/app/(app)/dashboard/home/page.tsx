import type { Metadata } from "next";

import { StudentDashboardView } from "@/components/app/dashboard/student-dashboard-view";
import { PageContainer } from "@/components/shared";

export const metadata: Metadata = { title: "لوحتي" };

/**
 * `/dashboard/home` — the learner's home.
 *
 * A thin Server Component: the data is fetched client-side through React Query
 * so that finishing a lesson can refresh these figures from cache without a
 * full navigation.
 *
 * It sits at `home` rather than at `/dashboard` itself so that the three
 * learner destinations are siblings — see the note in `../page.tsx` and
 * `docs/dashboard-restructure.md`.
 */
export default function StudentDashboardPage() {
  return (
    <PageContainer>
      <StudentDashboardView />
    </PageContainer>
  );
}
