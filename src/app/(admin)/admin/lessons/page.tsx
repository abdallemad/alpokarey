import type { Metadata } from "next";
import { FileText } from "lucide-react";

import {
  EmptyState,
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/admin/shared";

export const metadata: Metadata = { title: "الدروس" };

export default function AdminLessonsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="الدروس"
        description="دروس الفيديو والنصوص التابعة لكل مرحلة، مع المرفقات ومدة الدرس."
      />

      <SectionCard title="قائمة الدروس" flush>
        <EmptyState
          icon={FileText}
          title="لم يتم ربط الدروس بعد"
          description="سيظهر هنا جدول الدروس مع التبديل بين نوعي المحتوى (فيديو / نص) وإدارة المرفقات."
        />
      </SectionCard>
    </PageContainer>
  );
}
