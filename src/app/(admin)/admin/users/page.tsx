import { Suspense } from "react";
import type { Metadata } from "next";

import { DataTableSkeleton, PageContainer } from "@/components/admin/shared";
import { UsersView } from "@/components/admin/users";
import { USERS_PAGE_SIZE } from "@/constants/user";

export const metadata: Metadata = { title: "المستخدمون" };

/**
 * `/admin/users` — the accounts console.
 *
 * A thin Server Component like the rest of the console: the list is fetched
 * client-side through React Query so filters can live in the URL without a
 * server round trip per keystroke, and so the open detail panel can update in
 * place after a role change.
 *
 * The `<Suspense>` boundary is required, not decorative — `UsersView` reads
 * `useSearchParams()` (for the filters *and* for the open account), and
 * Next.js opts any component that does so out of prerendering unless it sits
 * inside one.
 */
export default function AdminUsersPage() {
  return (
    <PageContainer>
      <Suspense fallback={<DataTableSkeleton columns={4} rows={USERS_PAGE_SIZE} />}>
        <UsersView />
      </Suspense>
    </PageContainer>
  );
}
