import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";

import {
  EmptyState,
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/admin/shared";

export const metadata: Metadata = { title: "الاختبارات" };

export default function AdminQuizzesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="الاختبارات"
        description="اختبارات المراحل وأسئلتها وخياراتها، ودرجة النجاح المطلوبة لمنح الشهادة."
      />

      <SectionCard title="قائمة الاختبارات" flush>
        <EmptyState
          icon={ClipboardCheck}
          title="لم يتم ربط الاختبارات بعد"
          description="سيظهر هنا جدول الاختبارات مع محرّر الأسئلة والخيارات وتحديد الإجابة الصحيحة."
        />
      </SectionCard>
    </PageContainer>
  );
}
