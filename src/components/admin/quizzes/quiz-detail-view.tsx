"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Layers,
  Target,
  Trash2,
  Users,
} from "lucide-react";

import { PathStatusBadge } from "@/components/admin/paths/path-badges";
import {
  QuizActiveBadge,
  QuizKindBadge,
} from "@/components/admin/quizzes/quiz-badges";
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
import { QUIZ_KIND_DESCRIPTIONS } from "@/constants/quiz";
import { ROUTES } from "@/constants/routes";
import { QuizForm } from "@/forms/quiz-form";
import { useLessonOptions } from "@/hooks/use-lessons";
import { useDeleteQuiz, useQuiz, useUpdateQuiz } from "@/hooks/use-quiz";
import type { QuizDetail } from "@/types/quiz";
import { formatDateTime, formatNumber } from "@/utils/format";

/**
 * `/admin/quizzes/[quizId]` — the exam editor.
 *
 * A full page rather than a dialog: an exam carries its attachment, its
 * scoring, its activation state and a list of questions, and it is the surface
 * the question editor will land in.
 */
export function QuizDetailView({ quizId }: { quizId: string }) {
  const { data: quiz, isPending, isError, error, refetch } = useQuiz(quizId);

  if (isPending) {
    return (
      <>
        <PageHeaderSkeleton />
        <StatCardsSkeleton count={4} />
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
        title="تعذّر تحميل بيانات الاختبار"
        onRetry={() => refetch()}
      />
    );
  }

  return <QuizDetailContent quiz={quiz} />;
}

function QuizDetailContent({ quiz }: { quiz: QuizDetail }) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const updateQuiz = useUpdateQuiz(quiz.id);
  const deleteQuiz = useDeleteQuiz({ redirectToList: true });
  const { data: lessonOptions, isFetching: isLoadingLessons } =
    useLessonOptions(quiz.stage.id);

  const hasQuestions = quiz.questionsCount > 0;
  const linkedLesson = quiz.linkedLessons[0] ?? null;

  const stats = [
    { label: "الأسئلة", value: formatNumber(quiz.questionsCount), icon: ClipboardList },
    { label: "المحاولات", value: formatNumber(quiz.attemptsCount), icon: Users },
    { label: "درجة النجاح", value: `${formatNumber(quiz.passingScore)}%`, icon: Target },
    { label: "المدة", value: quiz.duration ?? "—", icon: CheckCircle2 },
  ];

  return (
    <>
      <PageHeader
        title={quiz.title}
        description={quiz.description ?? "لا يوجد وصف لهذا الاختبار بعد."}
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={ROUTES.admin.quizzes} />}
            >
              <ArrowRight />
              رجوع
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={deleteQuiz.isPending}
            >
              <Trash2 />
              حذف الاختبار
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <QuizKindBadge kind={quiz.kind} />
        <QuizActiveBadge active={quiz.active} />
        <PathStatusBadge status={quiz.stage.path.status} />

        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <Link href={`${ROUTES.admin.stages}?pathId=${quiz.stage.path.id}`} />
          }
        >
          <Layers />
          {quiz.stage.path.title} ▸ {quiz.stage.title}
        </Button>

        <span className="text-xs text-muted-foreground">
          آخر تحديث: {formatDateTime(quiz.updatedAt)}
        </span>
      </div>

      {/* What this exam is attached to, spelled out — the badge names the kind,
          this names the thing. */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <span className="text-muted-foreground">
          {QUIZ_KIND_DESCRIPTIONS[quiz.kind]}
        </span>

        {linkedLesson ? (
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={
              <Link href={`${ROUTES.admin.lessons}/${linkedLesson.id}`} />
            }
          >
            <BookOpen />
            {linkedLesson.title}
          </Button>
        ) : null}
      </div>

      {hasQuestions ? null : (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning-foreground dark:text-warning"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            لا توجد أسئلة في هذا الاختبار بعد، ولذلك لا يمكن تفعيله. تُضاف
            الأسئلة حاليًا من قاعدة البيانات مباشرة.
          </p>
        </div>
      )}

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
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <SectionCard
        title="تعديل بيانات الاختبار"
        description="تُحفظ التعديلات مباشرة بعد الضغط على زر الحفظ."
      >
        <QuizForm
          // Remounting on id change resets the form when navigating between
          // two exams without unmounting this screen.
          key={quiz.id}
          lockedStageLabel={`${quiz.stage.path.title} ▸ ${quiz.stage.title}`}
          lessonOptions={lessonOptions ?? []}
          isLoadingLessons={isLoadingLessons}
          canActivate={hasQuestions || quiz.active}
          activationHint={
            hasQuestions
              ? "الاختبار المفعّل يظهر للطلاب ويمكنهم دخوله."
              : "لا يمكن التفعيل قبل إضافة سؤال واحد على الأقل."
          }
          defaultValues={{
            stageId: quiz.stage.id,
            title: quiz.title,
            description: quiz.description ?? "",
            passingScore: quiz.passingScore,
            duration: quiz.duration ?? "",
            // A string keeps react-hook-form's dirty check comparing like with
            // like against what the number input reports back.
            order: String(quiz.order),
            isFinal: quiz.isFinal,
            active: quiz.active,
            lessonId: linkedLesson?.id ?? "",
          }}
          isPending={updateQuiz.isPending}
          errorMessage={updateQuiz.error?.message}
          submitLabel="حفظ التعديلات"
          onSubmit={(values) =>
            // `stageId` is deliberately not forwarded: the PATCH contract does
            // not accept it, because moving an exam is a migration rather than
            // an edit.
            updateQuiz.mutate({
              title: values.title,
              description: values.description,
              passingScore: values.passingScore,
              duration: values.duration,
              order: values.order,
              isFinal: values.isFinal,
              active: values.active,
              lessonId: values.lessonId,
            })
          }
        />
      </SectionCard>

      <SectionCard
        title="الأسئلة"
        description="عرض فقط في هذه المرحلة — محرّر الأسئلة والخيارات هو الخطوة التالية."
        flush={quiz.questions.length > 0}
      >
        {quiz.questions.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="لا توجد أسئلة"
            description="أضف أسئلة الاختبار حتى تتمكن من تفعيله للطلاب."
            className="py-10"
          />
        ) : (
          <ol className="divide-y divide-border">
            {quiz.questions.map((question, index) => (
              <li key={question.id} className="px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums">
                    {formatNumber(index + 1)}
                  </span>
                  <p className="text-sm font-medium">{question.text}</p>
                </div>

                <ul className="mt-2 space-y-1 ps-8.5">
                  {question.options.map((option) => (
                    <li
                      key={option.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      {option.isCorrect ? (
                        <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                      ) : (
                        <span className="size-3.5 shrink-0 rounded-full border border-border" />
                      )}
                      <span
                        className={
                          option.isCorrect
                            ? "text-success"
                            : "text-muted-foreground"
                        }
                      >
                        {option.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <DeleteConfirmationDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        entityName={quiz.title}
        description={
          quiz.attemptsCount > 0
            ? `يوجد ${formatNumber(quiz.attemptsCount)} محاولة مسجّلة لهذا الاختبار، ولن يسمح النظام بحذفه حفاظًا على سجل الطلاب. ألغِ تفعيله بدلًا من ذلك.`
            : "سيتم حذف الاختبار وكل أسئلته وخياراته نهائيًا. لا يمكن التراجع عن هذا الإجراء."
        }
        isPending={deleteQuiz.isPending}
        onConfirm={() =>
          deleteQuiz.mutate(quiz.id, {
            onSettled: () => setConfirmDelete(false),
          })
        }
      />
    </>
  );
}
