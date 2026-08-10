"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Info } from "lucide-react";

import { PageHeader, SectionCard } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { LessonForm } from "@/forms/lesson-form";
import { useCreateLesson } from "@/hooks/use-lesson";
import { usePathOptions } from "@/hooks/use-paths";
import { useStageOptions } from "@/hooks/use-stages";

/**
 * `/admin/lessons/new`.
 *
 * Accepts `?pathId=` and `?stageId=` so "add a lesson here" can be linked from
 * a stage without making the admin re-pick the curriculum they were already
 * looking at.
 *
 * The path ▸ stage cascade is owned here rather than inside `LessonForm`,
 * because loading the options is a request and forms stay out of the request
 * business — see `folder-structure.md`.
 */
export function NewLessonView() {
  const searchParams = useSearchParams();
  const createLesson = useCreateLesson();

  const [pathId, setPathId] = React.useState(searchParams.get("pathId") ?? "");

  const { data: pathOptions } = usePathOptions();
  const { data: stageOptions, isFetching: isLoadingStages } =
    useStageOptions(pathId);

  return (
    <>
      <PageHeader
        title="درس جديد"
        description="اختر المرحلة، ثم أدخل بيانات الدرس. تُضاف المرفقات بعد الحفظ."
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.admin.lessons} />}
          >
            <ArrowRight />
            رجوع إلى الدروس
          </Button>
        }
      />

      <SectionCard
        title="بيانات الدرس"
        description="يمكنك حفظ الدرس ثم إكمال محتواه ومرفقاته لاحقًا."
      >
        <p className="mb-6 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          المرفقات — التفريغات والملخصات والتشجيرات — تُضاف من صفحة الدرس بعد
          إنشائه، لأن المرفق يحتاج درسًا موجودًا ليرتبط به.
        </p>

        <LessonForm
          pathOptions={pathOptions ?? []}
          stageOptions={stageOptions ?? []}
          pathId={pathId}
          onPathChange={setPathId}
          isLoadingStages={isLoadingStages}
          defaultValues={{ stageId: searchParams.get("stageId") ?? "" }}
          isPending={createLesson.isPending}
          errorMessage={createLesson.error?.message}
          submitLabel="إنشاء الدرس"
          onSubmit={(values) => createLesson.mutate(values)}
        />
      </SectionCard>
    </>
  );
}
