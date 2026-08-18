"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { BookOpen, Layers } from "lucide-react";

import { CurriculumLessonItem } from "@/components/app/learn/curriculum-lesson-item";
import { CurriculumFinalQuizItem } from "@/components/app/learn/curriculum-quiz-item";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { LearnCurriculum } from "@/types/learn";
import { formatNumber } from "@/utils/format";

type CurriculumTreeProps = {
  curriculum: LearnCurriculum;
  /** Called after a link is followed — the mobile sidebar closes itself. */
  onNavigate?: () => void;
  className?: string;
};

/**
 * The whole curriculum, and where the learner is in it.
 *
 * One stage per accordion section, its lessons inside, each lesson's exam
 * nested under the lesson it tests, and the stage's final exam closing the
 * section in its own treatment. That shape is the feature: a flat list of
 * lessons and exams cannot say which exam belongs to what.
 *
 * The stage holding the open lesson expands on load, and stays expanded while
 * the learner moves within it — collapsing the section under someone as they
 * navigate is the fastest way to lose them.
 *
 * Chrome-free on purpose. It was extracted from the old `CurriculumPanel` card
 * when the curriculum moved into the player's sidebar
 * (`docs/learn-layout.md`): the tree is the part worth keeping, and the card
 * around it was the part the sidebar already provides.
 */
export function CurriculumTree({
  curriculum,
  onNavigate,
  className,
}: CurriculumTreeProps) {
  const pathname = usePathname();
  const pathId = curriculum.path.id;

  // Comparing built hrefs rather than parsing the pathname: `ROUTES` already
  // owns the URL shape, so a change there cannot leave this behind.
  const activeLessonId =
    curriculum.stages
      .flatMap((stage) => stage.lessons)
      .find((lesson) => pathname === ROUTES.app.lesson(pathId, lesson.id))
      ?.id ?? null;

  const activeQuizId =
    curriculum.stages
      .flatMap((stage) => [
        ...stage.lessons.flatMap((lesson) => (lesson.quiz ? [lesson.quiz] : [])),
        ...(stage.finalQuiz ? [stage.finalQuiz] : []),
      ])
      .find((quiz) => pathname === ROUTES.app.quiz(pathId, quiz.id))?.id ?? null;

  const activeStageId =
    curriculum.stages.find(
      (stage) =>
        stage.lessons.some((lesson) => lesson.id === activeLessonId) ||
        stage.lessons.some((lesson) => lesson.quiz?.id === activeQuizId) ||
        stage.finalQuiz?.id === activeQuizId,
    )?.id ?? curriculum.stages[0]?.id;

  const [openStages, setOpenStages] = React.useState<string[]>(() =>
    activeStageId ? [activeStageId] : [],
  );
  const [lastStageId, setLastStageId] = React.useState(activeStageId);

  // Opening a lesson from another stage — through "next", or from the sidebar —
  // has to bring that stage's section open with it. Adding rather than
  // replacing leaves anything the learner opened by hand alone.
  //
  // Adjusted during render rather than in an effect: this is state derived from
  // a prop change, and React re-runs the render before touching the DOM, so
  // the section is never painted closed and then snapped open.
  if (activeStageId && activeStageId !== lastStageId) {
    setLastStageId(activeStageId);
    setOpenStages((current) =>
      current.includes(activeStageId) ? current : [...current, activeStageId],
    );
  }

  if (curriculum.stages.length === 0) {
    return (
      <p className={cn("p-4 text-xs text-muted-foreground", className)}>
        لم تُضف مراحل لهذا المسار بعد. سيظهر المحتوى هنا فور نشره.
      </p>
    );
  }

  return (
    <Accordion
      multiple
      value={openStages}
      onValueChange={(value) => setOpenStages(value as string[])}
      className={cn("px-2 py-1", className)}
    >
      {curriculum.stages.map((stage) => (
        <AccordionItem key={stage.id} value={stage.id} className="border-none">
          <AccordionTrigger className="px-2 hover:no-underline">
            <span className="flex min-w-0 flex-1 flex-col gap-1 pe-2 text-start">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Layers className="size-3" />
                المرحلة {formatNumber(stage.order)}
              </span>
              <span className="truncate font-heading text-sm font-bold">
                {stage.title}
              </span>
              <span className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
                <BookOpen className="size-3" />
                {formatNumber(stage.completedLessonsCount)} /{" "}
                {formatNumber(stage.lessonsCount)}
                {stage.isCompleted ? (
                  <Badge className="border-transparent bg-success/15 text-success">
                    مكتملة
                  </Badge>
                ) : null}
              </span>
            </span>
          </AccordionTrigger>

          <AccordionContent className="pb-2">
            <ul className="space-y-0.5">
              {stage.lessons.map((lesson) => (
                <CurriculumLessonItem
                  key={lesson.id}
                  lesson={lesson}
                  pathId={pathId}
                  activeLessonId={activeLessonId}
                  activeQuizId={activeQuizId}
                  onNavigate={onNavigate}
                />
              ))}

              {stage.lessons.length === 0 ? (
                <li className="px-2 py-1.5 text-xs text-muted-foreground">
                  لا توجد دروس في هذه المرحلة بعد.
                </li>
              ) : null}

              {stage.finalQuiz ? (
                <CurriculumFinalQuizItem
                  quiz={stage.finalQuiz}
                  pathId={pathId}
                  isActive={stage.finalQuiz.id === activeQuizId}
                  onNavigate={onNavigate}
                />
              ) : null}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
