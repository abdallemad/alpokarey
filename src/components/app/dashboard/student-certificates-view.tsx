"use client";

import Link from "next/link";
import { Route } from "lucide-react";

import { EarnedCertificates } from "@/components/app/dashboard/recent-attempts";
import { ApiErrorState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import { useStudentDashboard } from "@/hooks/use-student-dashboard";
import { formatNumber } from "@/utils/format";

/**
 * `/dashboard/certificates`.
 *
 * Deliberately backed by the dashboard query rather than one of its own —
 * `queryKeys.student.dashboard()` is already populated when the learner
 * arrives from their dashboard, so this screen usually renders instantly and
 * can never report a different count than the card they clicked.
 */
export function StudentCertificatesView() {
  const { data, isPending, isError, error, refetch } = useStudentDashboard();

  if (isPending) {
    return (
      <>
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </>
    );
  }

  if (isError) {
    return (
      <ApiErrorState
        error={error}
        title="تعذّر تحميل الشهادات"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="شهاداتي"
        description={
          data.certificates.length > 0
            ? `حصلت على ${formatNumber(data.certificates.length)} شهادة إتمام.`
            : "تُمنح شهادة الإتمام عند إنهاء مسار مفعّلة شهادته."
        }
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.app.home} />}
          >
            <Route />
            لوحتي
          </Button>
        }
      />

      <EarnedCertificates certificates={data.certificates} />
    </>
  );
}
