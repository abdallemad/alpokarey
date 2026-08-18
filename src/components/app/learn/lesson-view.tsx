"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock,
  Layers,
  Loader2,
  Paperclip,
} from "lucide-react";

import { LearnStepNav } from "@/components/app/learn/learn-step-nav";
import { LessonAttachmentList } from "@/components/app/learn/lesson-attachment-list";
import { LessonPlayer } from "@/components/app/learn/lesson-player";
import { LessonViewSkeleton } from "@/components/app/learn/learn-skeletons";
import { ApiErrorState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { LESSON_TYPE_LABELS } from "@/constants/lesson";
import { ROUTES } from "@/constants/routes";
import { useCurriculum } from "@/hooks/use-curriculum";
import { useLearnLesson } from "@/hooks/use-learn-lesson";
import { useLessonProgress } from "@/hooks/use-lesson-progress";
import type { LearnQuizSummary } from "@/types/learn";
import { findNeighbours, toSteps } from "@/utils/curriculum";
import { formatNumber } from "@/utils/format";

/**
 * The player's second part: one lesson, open.
 *
 * Top to bottom it answers the questions a learner arrives with, in order:
 * where am I (the stage line), what is this (the title), show me (the player),
 * did I finish it (the toggle), what else came with it (the tabs), and what
 * now (the exam card and the prev/next bar).
 *
 * The tabs carry the *reading* material rather than the lesson itself. The
 * lesson — a video or a body of text — is never behind a tab, because putting
 * the thing a learner came for one click away from the top of the page is how a
 * course player stops being one.
 */
export function LessonView({
  pathId,
  lessonId,
}: {
  pathId: string;
  lessonId: string;
}) {
  const { data: curriculum } = useCurriculum(pathId);
  const {
    data: lesson,
    isPending,
    isError,
    error,
    refetch,
  } = useLearnLesson(pathId, lessonId);
  const progress = useLessonProgress(pathId, lessonId);

  if (isPending) {
    return <LessonViewSkeleton />;
  }

  if (isError) {
    return (
      <ApiErrorState
        error={error}
        title="تعذّر تحميل الدرس"
        onRetry={() => refetch()}
      />
    );
  }

  // The sidebar's tree is the sequence, so "next" is always the row below the
  // one highlighted there — see `utils/curriculum.ts`.
  const { previous, next } = findNeighbours(
    curriculum ? toSteps(curriculum.stages) : [],
    "lesson",
    lessonId,
  );

  const hasContentTab = lesson.type === "VIDEO" && Boolean(lesson.content);

  return (
    <div className="space-y-4">
      <LessonPlayer lesson={lesson} />

      <Card>
        <CardHeader>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Layers className="size-3.5" />
              المرحلة {formatNumber(lesson.stage.order)}: {lesson.stage.title}
            </span>
            <span className="inline-flex items-center gap-1">
              {LESSON_TYPE_LABELS[lesson.type]}
            </span>
            {lesson.duration ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {lesson.duration}
              </span>
            ) : null}
          </p>

          <CardTitle className="font-heading text-xl font-bold">
            {formatNumber(lesson.order)}. {lesson.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={lesson.isCompleted ? "outline" : "default"}
              disabled={progress.isPending}
              onClick={() => progress.mutate(!lesson.isCompleted)}
            >
              {progress.isPending ? (
                <Loader2 className="animate-spin" />
              ) : lesson.isCompleted ? (
                <CheckCircle2 />
              ) : (
                <Circle />
              )}
              {lesson.isCompleted
                ? "تم إتمام هذا الدرس"
                : "تحديد الدرس كمكتمل"}
            </Button>

            {lesson.isCompleted ? (
              <Badge className="border-transparent bg-success/15 text-success">
                <CheckCircle2 />
                مكتمل
              </Badge>
            ) : null}
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">الوصف</TabsTrigger>

              {/* Only when a video lesson also carries a body — the editor
                  swaps the two fields, so this is the mixed record rather than
                  the normal one, and an always-present empty tab would be a
                  standing invitation to click nothing. */}
              {hasContentTab ? (
                <TabsTrigger value="content">المحتوى</TabsTrigger>
              ) : null}

              <TabsTrigger value="attachments">
                <Paperclip />
                المرفقات
                {lesson.attachments.length > 0 ? (
                  <Badge variant="secondary" className="tabular-nums">
                    {formatNumber(lesson.attachments.length)}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="pt-4">
              {lesson.description ? (
                <p className="text-sm leading-8 whitespace-pre-wrap text-muted-foreground">
                  {lesson.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  لم يُضف وصف لهذا الدرس.
                </p>
              )}
            </TabsContent>

            {hasContentTab ? (
              <TabsContent value="content" className="pt-4">
                <p className="text-sm leading-8 whitespace-pre-wrap">
                  {lesson.content}
                </p>
              </TabsContent>
            ) : null}

            <TabsContent value="attachments" className="pt-4">
              <LessonAttachmentList attachments={lesson.attachments} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {lesson.quiz ? (
        <LessonQuizCard pathId={pathId} quiz={lesson.quiz} />
      ) : null}

      <LearnStepNav pathId={pathId} previous={previous} next={next} />
    </div>
  );
}

/**
 * The lesson's own exam, offered where it belongs: at the end of the lesson.
 *
 * The sidebar already nests it under this lesson, but a learner who has just
 * finished watching is looking at the bottom of the page, not at the tree.
 */
function LessonQuizCard({
  pathId,
  quiz,
}: {
  pathId: string;
  quiz: LearnQuizSummary;
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ClipboardCheck className="size-3.5" />
            اختبار هذا الدرس
          </p>

          <p className="truncate font-heading text-base font-bold">
            {quiz.title}
          </p>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{formatNumber(quiz.questionsCount)} سؤال</span>
            <span>النجاح من {formatNumber(quiz.passingScore)}%</span>
            {quiz.duration ? <span>{quiz.duration}</span> : null}
            {quiz.isPassed ? (
              <Badge className="border-transparent bg-success/15 text-success">
                <Award />
                اجتزته بنسبة {formatNumber(quiz.bestScore ?? 0)}%
              </Badge>
            ) : null}
          </p>
        </div>

        <Button
          nativeButton={false}
          className="shrink-0"
          render={<Link href={ROUTES.app.quiz(pathId, quiz.id)} />}
        >
          {quiz.attemptsCount > 0 ? "إعادة الاختبار" : "ابدأ الاختبار"}
          <ArrowLeft />
        </Button>
      </CardContent>
    </Card>
  );
}
