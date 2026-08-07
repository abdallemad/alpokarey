import type { Metadata } from "next";
import { Layers } from "lucide-react";

import {
  EmptyState,
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/admin/shared";

export const metadata: Metadata = { title: "المراحل" };

export default function AdminStagesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="المراحل"
        description="مراحل كل مسار وترتيبها، مع مراعاة المدة المعيارية للمرحلة (5–10 ساعات)."
      />

      <SectionCard title="قائمة المراحل" flush>
        <EmptyState
          icon={Layers}
          title="لم يتم ربط المراحل بعد"
          description="سيظهر هنا جدول المراحل مرتبطًا بالمسار الأب مع إمكانية إعادة الترتيب."
        />
      </SectionCard>
    </PageContainer>
  );
}
