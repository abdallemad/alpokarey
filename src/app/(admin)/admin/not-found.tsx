import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { EmptyState, PageContainer } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

/**
 * Shown for unknown `/admin/*` URLs and for `notFound()` calls in admin pages —
 * a deleted path, a stale bookmark. Renders inside the shell so the sidebar
 * stays available.
 */
export default function AdminNotFound() {
  return (
    <PageContainer>
      <EmptyState
        icon={FileQuestion}
        title="الصفحة غير موجودة"
        description="الرابط الذي طلبته غير متاح داخل لوحة التحكم، أو أن العنصر المطلوب قد تم حذفه."
        action={
          <Button
            nativeButton={false}
            render={<Link href={ROUTES.admin.dashboard} />}
          >
            العودة إلى لوحة التحكم
          </Button>
        }
      />
    </PageContainer>
  );
}
