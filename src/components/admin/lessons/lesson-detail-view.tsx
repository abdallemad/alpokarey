"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Layers,
  Paperclip,
  Trash2,
} from "lucide-react";

import { LessonAttachments } from "@/components/admin/lessons/lesson-attachments";
import {
  LessonSourceBadge,
  LessonTypeBadge,
} from "@/components/admin/lessons/lesson-badges";
import { PathStatusBadge } from "@/components/admin/paths/path-badges";
import {
  ApiErrorState,
  DeleteConfirmationDialog,
  PageHeader,
  PageHeaderSkeleton,
  SectionCard,
  StatCardsSkeleton,
} from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import { LessonForm } from "@/forms/lesson-form";
import { useDeleteLesson, useLesson, useUpdateLesson } from "@/hooks/use-lesson";
import type { LessonDetail } from "@/types/lesson";
import { formatDateTime, formatNumber } from "@/utils/format";

/**
 * `/admin/lessons/[lessonId]` — the lesson editor.
 *
 * A full page rather than a dialog, unlike a stage: a lesson carries a body of
 * text or a video plus a list of attachments, which is more than a modal can
 * hold, and it is the surface an author spends real time in.
 */
export function LessonDetailView({ lessonId }: { lessonId: string }) {
  const { data: lesson, isPending, isError, error, refetch } =
    useLesson(lessonId);

  if (isPending) {
    return (
      <>
        <PageHeaderSkeleton />
        <StatCardsSkeleton count={3} />
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
        title="تعذّر تحميل بيانات الدرس"
        onRetry={() => refetch()}
      />
    );
  }

  return <LessonDetailContent lesson={lesson} />;
}

function LessonDetailContent({ lesson }: { lesson: LessonDetail }) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const updateLesson = useUpdateLesson(lesson.id);
  const deleteLesson = useDeleteLesson({ redirectToList: true });

  // A lesson with no body is a legitimate work-in-progress, so it is flagged
  // here rather than blocked by the schema — see `lessonUpdateSchema`.
  const hasContent =
    lesson.type === "VIDEO" ? Boolean(lesson.videoUrl) : Boolean(lesson.content);

  const stats = [
    {
      label: "المرفقات",
      value: formatNumber(lesson.attachmentsCount),
      icon: Paperclip,
    },
    {
      label: "أتمّوا الدرس",
      value: formatNumber(lesson.completionsCount),
      icon: CheckCircle,
    },
    { label: "المدة", value: lesson.duration ?? "—", icon: Clock },
  ];

  return (
    <>
      <PageHeader
        title={lesson.title}
        description={lesson.description ?? "لا يوجد وصف لهذا الدرس بعد."}
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={ROUTES.admin.lessons} />}
            >
              <ArrowRight />
              رجوع
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={deleteLesson.isPending}
            >
              <Trash2 />
              حذف الدرس
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <LessonTypeBadge type={lesson.type} />
        <LessonSourceBadge type={lesson.type} contentType={lesson.contentType} />
        <PathStatusBadge status={lesson.stage.path.status} />

        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <Link
              href={`${ROUTES.admin.stages}?pathId=${lesson.stage.path.id}`}
            />
          }
        >
          <Layers />
          {lesson.stage.path.title} ▸ {lesson.stage.title}
        </Button>

        <span className="text-xs text-muted-foreground">
          آخر تحديث: {formatDateTime(lesson.updatedAt)}
        </span>
      </div>

      {hasContent ? null : (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning-foreground dark:text-warning"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            {lesson.type === "VIDEO"
              ? "لا يوجد رابط فيديو لهذا الدرس بعد — أضفه من النموذج أدناه."
              : "لا يوجد محتوى نصي لهذا الدرس بعد — أضفه من النموذج أدناه."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <SectionCard
        title="تعديل بيانات الدرس"
        description="تُحفظ التعديلات مباشرة بعد الضغط على زر الحفظ."
      >
        <LessonForm
          // Remounting on id change resets the form when navigating between
          // two lessons without unmounting this screen.
          key={lesson.id}
          lockedStageLabel={`${lesson.stage.path.title} ▸ ${lesson.stage.title}`}
          defaultValues={{
            stageId: lesson.stage.id,
            title: lesson.title,
            description: lesson.description ?? "",
            type: lesson.type,
            contentType: lesson.contentType,
            videoUrl: lesson.videoUrl ?? "",
            content: lesson.content ?? "",
            duration: lesson.duration ?? "",
            // A string keeps react-hook-form's dirty check comparing like with
            // like against what the number input reports back.
            order: String(lesson.order),
          }}
          isPending={updateLesson.isPending}
          errorMessage={updateLesson.error?.message}
          submitLabel="حفظ التعديلات"
          onSubmit={(values) =>
            // `stageId` is deliberately not forwarded: the PATCH contract does
            // not accept it, because moving a lesson is a migration rather
            // than an edit.
            updateLesson.mutate({
              title: values.title,
              description: values.description,
              type: values.type,
              contentType: values.contentType,
              videoUrl: values.videoUrl,
              content: values.content,
              duration: values.duration,
              order: values.order,
            })
          }
        />
      </SectionCard>

      <LessonAttachments
        lessonId={lesson.id}
        attachments={lesson.attachments}
      />

      <DeleteConfirmationDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        entityName={lesson.title}
        description={
          lesson.completionsCount > 0
            ? `يوجد ${formatNumber(lesson.completionsCount)} سجل إتمام مرتبط بهذا الدرس، ولن يسمح النظام بحذفه حفاظًا على سجل الطلاب.`
            : "سيتم حذف الدرس وكل مرفقاته نهائيًا، بما في ذلك الملفات المرفوعة. لا يمكن التراجع عن هذا الإجراء."
        }
        isPending={deleteLesson.isPending}
        onConfirm={() =>
          deleteLesson.mutate(lesson.id, {
            onSettled: () => setConfirmDelete(false),
          })
        }
      />
    </>
  );
}
