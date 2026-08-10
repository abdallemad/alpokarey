"use client";

import Link from "next/link";
import { BookOpen, Route } from "lucide-react";

import { ContinueLearningCard } from "@/components/app/dashboard/continue-learning-card";
import { EnrolledPathCard } from "@/components/app/dashboard/enrolled-path-card";
import {
  EarnedCertificates,
  RecentAttempts,
} from "@/components/app/dashboard/recent-attempts";
import { StudentStatCards } from "@/components/app/dashboard/student-stat-cards";
import { ApiErrorState, EmptyState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import { useStudentDashboard } from "@/hooks/use-student-dashboard";

/**
 * `/dashboard` — the learner's home.
 *
 * The order of the page is the order of a learner's questions: where was I
 * (the resume card), how am I doing (the figures), what am I studying (the
 * paths), how did I score, and what have I earned.
 *
 * All of it comes from one request. The dashboard is a single read of one
 * person's record, so splitting it across endpoints would only add waterfalls.
 */
export function StudentDashboardView() {
  const { data, isPending, isError, error, refetch } = useStudentDashboard();

  if (isPending) {
    return <StudentDashboardSkeleton />;
  }

  if (isError) {
    return (
      <ApiErrorState
        error={error}
        title="تعذّر تحميل لوحتك"
        onRetry={() => refetch()}
      />
    );
  }

  const hasPaths = data.paths.length > 0;

  return (
    <>
      <PageHeader
        title={`أهلًا، ${data.displayName}`}
        description={
          hasPaths
            ? "تابع مسيرتك العلمية من حيث توقفت."
            : "ابدأ رحلتك بالتسجيل في أول مسار."
        }
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.app.paths} />}
          >
            <Route />
            تصفّح المسارات
          </Button>
        }
      />

      {data.continueLesson ? (
        <ContinueLearningCard continueLesson={data.continueLesson} />
      ) : null}

      <StudentStatCards stats={data.stats} />

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-bold">مساراتي</h2>

        {hasPaths ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {data.paths.map((path) => (
              <EnrolledPathCard key={path.id} path={path} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="px-0">
              <EmptyState
                icon={BookOpen}
                title="لم تسجّل في أي مسار بعد"
                description="اختر مسارًا يناسب مستواك واهتمامك، وابدأ أول درس اليوم."
                action={
                  <Button
                    nativeButton={false}
                    render={<Link href={ROUTES.app.paths} />}
                  >
                    <Route />
                    تصفّح المسارات
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentAttempts attempts={data.recentAttempts} />
        <EarnedCertificates certificates={data.certificates} />
      </div>
    </>
  );
}

/** Mirrors the real layout's blocks so nothing shifts when data arrives. */
function StudentDashboardSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      <Skeleton className="h-24 w-full rounded-xl" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-6 w-28" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Card key={index}>
            <CardContent className="space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-1 w-full" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
