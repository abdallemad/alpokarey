import type { Metadata } from "next";
import { Route } from "lucide-react";

import {
  EmptyState,
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/admin/shared";

export const metadata: Metadata = { title: "المسارات" };

export default function AdminPathsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="المسارات"
        description="إدارة المسارات التعليمية: العنوان، التصنيف، حالة النشر، وتفعيل الشهادات."
      />

      <SectionCard title="قائمة المسارات" flush>
        <EmptyState
          icon={Route}
          title="لم يتم ربط المسارات بعد"
          description="سيظهر هنا جدول المسارات مع البحث والتصفية والترقيم بعد تنفيذ خاصية المسارات."
        />
      </SectionCard>
    </PageContainer>
  );
}
