import type { Metadata } from "next";
import { Users } from "lucide-react";

import {
  EmptyState,
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/admin/shared";

export const metadata: Metadata = { title: "المستخدمون" };

export default function AdminUsersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="المستخدمون"
        description="حسابات الطلاب والمشرفين المتزامنة مع Clerk، وصلاحية كل حساب."
      />

      <SectionCard title="قائمة المستخدمين" flush>
        <EmptyState
          icon={Users}
          title="لم يتم ربط المستخدمين بعد"
          description="سيظهر هنا جدول الحسابات مع البحث وتغيير الصلاحية بين طالب ومشرف."
        />
      </SectionCard>
    </PageContainer>
  );
}
