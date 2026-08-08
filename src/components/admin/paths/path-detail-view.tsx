"use client";

import Link from "next/link";
import {
  Award,
  BookOpen,
  ClipboardCheck,
  FileText,
  Layers,
  Trash2,
  Users,
} from "lucide-react";

import {
  PathCategoryBadge,
  PathFeaturedBadge,
  PathStatusBadge,
} from "@/components/admin/paths/path-badges";
import {
  ApiErrorState,
  DeleteConfirmationDialog,
  EmptyState,
  PageHeader,
  PageHeaderSkeleton,
  SectionCard,
  StatCardsSkeleton,
} from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PathForm } from "@/forms/path-form";
import { ROUTES } from "@/constants/routes";
import { useDeletePath, usePath, useUpdatePath } from "@/hooks/use-path";
import type { PathDetail } from "@/types/path";
import { formatDateTime, formatNumber } from "@/utils/format";
import * as React from "react";

export function PathDetailView({ pathId }: { pathId: string }) {
  const { data: path, isPending, isError, error, refetch } = usePath(pathId);

  if (isPending) {
    return (
      <>
        <PageHeaderSkeleton />
        <StatCardsSkeleton />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full max-w-2xl" />
            <Skeleton className="h-24 w-full max-w-2xl" />
            <Skeleton className="h-8 w-40" />
          </CardContent>
        </Card>
      </>
    );
  }

  if (isError) {
    return (
      <ApiErrorState
        error={error}
        title="تعذّر تحميل بيانات المسار"
        onRetry={() => refetch()}
      />
    );
  }

  return <PathDetailContent path={path} />;
}

function PathDetailContent({ path }: { path: PathDetail }) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const updatePath = useUpdatePath(path.id);
  const deletePath = useDeletePath({ redirectToList: true });

  const stats = [
    { label: "المراحل", value: path.stagesCount, icon: Layers },
    { label: "الدروس", value: path.lessonsCount, icon: FileText },
    { label: "التسجيلات", value: path.enrollmentsCount, icon: Users },
    { label: "الشهادات", value: path.certificatesCount, icon: Award },
  ];

  return (
    <>
      <PageHeader
        title={path.title}
        description={path.description ?? "لا يوجد وصف لهذا المسار بعد."}
        actions={
          <Button
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
            disabled={deletePath.isPending}
          >
            <Trash2 />
            حذف المسار
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <PathStatusBadge status={path.status} />
        <PathCategoryBadge category={path.category} />
        <PathFeaturedBadge isFeatured={path.isFeatured} />
        {path.certificationActivated ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Award className="size-3.5" />
            الشهادة مُفعّلة
          </span>
        ) : null}
        <span className="text-xs text-muted-foreground">
          آخر تحديث: {formatDateTime(path.updatedAt)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <stat.icon className="size-4" />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-bold tabular-nums">
                {formatNumber(stat.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <SectionCard
        title="مراحل المسار"
        description="المراحل مرتبة حسب تسلسل دراستها."
        action={
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.admin.stages} />}
          >
            إدارة المراحل
          </Button>
        }
        flush={path.stages.length > 0}
      >
        {path.stages.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="لا توجد مراحل بعد"
            description="أضف مرحلة واحدة على الأقل حتى تتمكن من نشر المسار وتفعيل الشهادة."
          />
        ) : (
          <ol className="divide-y divide-border">
            {path.stages.map((stage) => (
              <li
                key={stage.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums">
                  {formatNumber(stage.order)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {stage.title}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <BookOpen className="size-3.5" />
                  {formatNumber(stage.lessonsCount)} درس
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ClipboardCheck className="size-3.5" />
                  {formatNumber(stage.quizzesCount)} اختبار
                </span>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <SectionCard
        title="تعديل بيانات المسار"
        description="تُحفظ التعديلات مباشرة بعد الضغط على زر الحفظ."
      >
        <PathForm
          // Remounting on id change resets the form when navigating between
          // two paths without unmounting this screen.
          key={path.id}
          defaultValues={{
            title: path.title,
            description: path.description ?? "",
            category: path.category ?? "",
            status: path.status,
            isFeatured: path.isFeatured,
            certificationActivated: path.certificationActivated,
            imageUrl: path.imageUrl ?? "",
            promoUrl: path.promoUrl ?? "",
          }}
          isPending={updatePath.isPending}
          onSubmit={(values) => updatePath.mutate(values)}
          submitLabel="حفظ التعديلات"
        />
      </SectionCard>

      <DeleteConfirmationDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        entityName={path.title}
        description={
          path.enrollmentsCount > 0
            ? `يوجد ${formatNumber(path.enrollmentsCount)} تسجيل مرتبط بهذا المسار، ولن يسمح النظام بحذفه. حوّله إلى مسودة بدلًا من ذلك.`
            : "سيتم حذف المسار وكل مراحله ودروسه واختباراته نهائيًا. لا يمكن التراجع عن هذا الإجراء."
        }
        isPending={deletePath.isPending}
        onConfirm={() =>
          deletePath.mutate(path.id, {
            onSettled: () => setConfirmDelete(false),
          })
        }
      />
    </>
  );
}
