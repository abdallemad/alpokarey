import { Award, BookOpen, GraduationCap, Route, TrendingUp } from "lucide-react";

import {
  EmptyState,
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/admin/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Placeholder figures. The real numbers arrive with the dashboard feature,
 * which reads them through the Service layer — see `docs/folder-structure.md`
 * for the one documented exception that lets this page call Services directly.
 */
const STAT_PLACEHOLDERS = [
  { label: "المسارات المنشورة", icon: Route, hint: "إجمالي المسارات المتاحة" },
  { label: "التسجيلات", icon: BookOpen, hint: "عدد الطلاب المسجّلين" },
  { label: "نسبة الإكمال", icon: TrendingUp, hint: "متوسط تقدّم الطلاب" },
  { label: "الشهادات الممنوحة", icon: Award, hint: "شهادات إتمام المسارات" },
];

export default function AdminDashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="لوحة التحكم"
        description="نظرة عامة على نشاط الأكاديمية: المسارات، التسجيلات، ومعدلات الإكمال."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_PLACEHOLDERS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <stat.icon className="size-4" />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-heading text-3xl font-bold tabular-nums">—</p>
              <p className="text-xs text-muted-foreground">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <SectionCard
        title="أحدث النشاطات"
        description="آخر التسجيلات والشهادات الممنوحة عبر المنصة."
      >
        <EmptyState
          icon={GraduationCap}
          title="لا توجد بيانات بعد"
          description="ستظهر هنا إحصاءات المنصة وأحدث نشاطات الطلاب بعد ربط لوحة التحكم بقاعدة البيانات."
        />
      </SectionCard>
    </PageContainer>
  );
}
