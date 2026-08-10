"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Info } from "lucide-react";

import { PageHeader, SectionCard } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { QuizForm } from "@/forms/quiz-form";
import { useCreateQuiz } from "@/hooks/use-quiz";
import { useLessonOptions } from "@/hooks/use-lessons";
import { usePathOptions } from "@/hooks/use-paths";
import { useStageOptions } from "@/hooks/use-stages";

/**
 * `/admin/quizzes/new`.
 *
 * Accepts `?pathId=`, `?stageId=` and `?lessonId=` so "add an exam here" can
 * be linked from a stage or a lesson without making the admin re-pick the
 * curriculum they were already looking at.
 *
 * The path ▸ stage cascade — and the lesson list that depends on the stage —
 * are owned here rather than inside `QuizForm`, because loading options is a
 * request and forms stay out of the request business.
 */
export function NewQuizView() {
  const searchParams = useSearchParams();
  const createQuiz = useCreateQuiz();

  const [pathId, setPathId] = React.useState(searchParams.get("pathId") ?? "");
  const [stageId, setStageId] = React.useState(
    searchParams.get("stageId") ?? "",
  );

  const { data: pathOptions } = usePathOptions();
  const { data: stageOptions, isFetching: isLoadingStages } =
    useStageOptions(pathId);
  const { data: lessonOptions, isFetching: isLoadingLessons } =
    useLessonOptions(stageId);

  return (
    <>
      <PageHeader
        title="اختبار جديد"
        description="اختر المرحلة، ثم حدّد نوع الاختبار: نهائي للمرحلة أو مرتبط بدرس."
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.admin.quizzes} />}
          >
            <ArrowRight />
            رجوع إلى الاختبارات
          </Button>
        }
      />

      <SectionCard
        title="بيانات الاختبار"
        description="يمكنك حفظ الاختبار ثم إضافة أسئلته وتفعيله لاحقًا."
      >
        <p className="mb-6 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          يُنشأ الاختبار غير مفعّل، لأن التفعيل يتطلب وجود سؤال واحد على الأقل.
          فعّله من صفحته بعد إضافة الأسئلة.
        </p>

        <QuizForm
          pathOptions={pathOptions ?? []}
          stageOptions={stageOptions ?? []}
          pathId={pathId}
          onPathChange={(next) => {
            setPathId(next);
            // The stage — and with it the lesson list — belongs to the old
            // path until the admin picks a new one.
            setStageId("");
          }}
          onStageChange={setStageId}
          isLoadingStages={isLoadingStages}
          lessonOptions={lessonOptions ?? []}
          isLoadingLessons={isLoadingLessons}
          defaultValues={{
            stageId: searchParams.get("stageId") ?? "",
            lessonId: searchParams.get("lessonId") ?? "",
          }}
          isPending={createQuiz.isPending}
          errorMessage={createQuiz.error?.message}
          submitLabel="إنشاء الاختبار"
          onSubmit={(values) => createQuiz.mutate(values)}
        />
      </SectionCard>
    </>
  );
}
