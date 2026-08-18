"use client";

import Link from "next/link";
import { Circle, CheckCircle2, FileText, PlayCircle } from "lucide-react";

import { CurriculumQuizItem } from "@/components/app/learn/curriculum-quiz-item";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { LearnLessonSummary } from "@/types/learn";
import { formatNumber } from "@/utils/format";

type CurriculumLessonItemProps = {
  lesson: LearnLessonSummary;
  pathId: string;
  activeLessonId: string | null;
  activeQuizId: string | null;
  onNavigate?: () => void;
};

/**
 * One lesson in the curriculum tree, with its own exam nested underneath.
 *
 * The status mark on the start edge is the one thing a learner scans this list
 * for, so it is a filled tick when the lesson is done and a hollow circle when
 * it is not — a shape difference, not only a colour one, so the state survives
 * being read by someone who cannot separate the two greens.
 */
export function CurriculumLessonItem({
  lesson,
  pathId,
  activeLessonId,
  activeQuizId,
  onNavigate,
}: CurriculumLessonItemProps) {
  const isActive = lesson.id === activeLessonId;
  const TypeIcon = lesson.type === "TEXT" ? FileText : PlayCircle;

  return (
    <>
      <li>
        <Link
          href={ROUTES.app.lesson(pathId, lesson.id)}
          onClick={onNavigate}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            isActive
              ? "bg-primary/10 font-medium text-primary"
              : "hover:bg-muted",
          )}
        >
          {lesson.isCompleted ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          ) : (
            <Circle
              className={cn(
                "mt-0.5 size-4 shrink-0",
                isActive ? "text-primary" : "text-muted-foreground/60",
              )}
            />
          )}

          <span className="min-w-0 flex-1">
            <span className="block truncate">
              {formatNumber(lesson.order)}. {lesson.title}
            </span>

            <span className="mt-0.5 flex items-center gap-2 text-[0.7rem] text-muted-foreground">
              <TypeIcon className="size-3" />
              {lesson.duration ? <span>{lesson.duration}</span> : null}
              {lesson.attachmentsCount > 0 ? (
                <span>{formatNumber(lesson.attachmentsCount)} مرفق</span>
              ) : null}
            </span>
          </span>
        </Link>
      </li>

      {lesson.quiz ? (
        <CurriculumQuizItem
          quiz={lesson.quiz}
          pathId={pathId}
          isActive={lesson.quiz.id === activeQuizId}
          onNavigate={onNavigate}
        />
      ) : null}
    </>
  );
}
