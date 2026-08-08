"use client";

import { Award, BookOpen, Route, TrendingUp } from "lucide-react";

import {
  ErrorState,
  PageContainer,
  PageHeader,
  SectionCard,
  StatCardsSkeleton,
} from "@/components/admin/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetAdminData } from "@/hooks/use-dashboard";
import { formatNumber } from "@/utils/format";

export function DashboardView() {
  const { data, isPending, isError, error, refetch } = useGetAdminData();

  if (isError) {
    return (
      <PageContainer>
        <PageHeader
          title="لوحة التحكم"
          description="نظرة عامة على نشاط الأكاديمية: المسارات، التسجيلات، ومعدلات الإكمال."
        />
        <ErrorState
          title="تعذّر تحميل البيانات"
          description={error.message}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="لوحة التحكم"
        description="نظرة عامة على نشاط الأكاديمية: المسارات، التسجيلات، ومعدلات الإكمال."
      />

      {isPending ? (
        <StatCardsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Route className="size-4" />
                المسارات المنشورة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-heading text-3xl font-bold tabular-nums">
                {formatNumber(data.stats.publishedPaths)}
              </p>
              <p className="text-xs text-muted-foreground">إجمالي المسارات المتاحة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BookOpen className="size-4" />
                التسجيلات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-heading text-3xl font-bold tabular-nums">
                {formatNumber(data.stats.totalEnrollments)}
              </p>
              <p className="text-xs text-muted-foreground">عدد الطلاب المسجّلين</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="size-4" />
                نسبة الإكمال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-heading text-3xl font-bold tabular-nums">
                {formatNumber(data.stats.averageCompletionRate)}%
              </p>
              <p className="text-xs text-muted-foreground">متوسط تقدم الطلاب</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Award className="size-4" />
                الشهادات الممنوحة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-heading text-3xl font-bold tabular-nums">
                {formatNumber(data.stats.grantedCertificates)}
              </p>
              <p className="text-xs text-muted-foreground">شهادات إتمام المسارات</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="المسارات الأكثر تسجيلاً" description="أعلى 5 مسارات من حيث إقبال الطلاب">
          {isPending ? (
            <div className="h-48 animate-pulse rounded-md bg-muted" />
          ) : data.topEnrolledPaths.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              لا توجد تسجيلات بعد
            </div>
          ) : (
            <div className="space-y-4">
              {data.topEnrolledPaths.map((path, index) => (
                <div key={path.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                    <span className="text-sm font-medium">{path.title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(path.count)} تسجيل
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="المسارات الأكثر إنجازاً" description="أعلى 5 مسارات من حيث منح الشهادات">
          {isPending ? (
            <div className="h-48 animate-pulse rounded-md bg-muted" />
          ) : data.topCompletedPaths.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              لا توجد إنجازات بعد
            </div>
          ) : (
            <div className="space-y-4">
              {data.topCompletedPaths.map((path, index) => (
                <div key={path.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                    <span className="text-sm font-medium">{path.title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(path.count)} شهادة
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  );
}
