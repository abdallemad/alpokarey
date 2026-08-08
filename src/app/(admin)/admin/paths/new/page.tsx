import type { Metadata } from "next";

import { NewPathView } from "@/components/admin/paths/new-path-view";
import { PageContainer } from "@/components/admin/shared";

export const metadata: Metadata = { title: "مسار جديد" };

export default function AdminNewPathPage() {
  return (
    <PageContainer>
      <NewPathView />
    </PageContainer>
  );
}
