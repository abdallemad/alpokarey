"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardCheck, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import type { LearnStep } from "@/types/learn";

/** Where a step lives — the one place the two player routes are chosen between. */
export function stepHref(pathId: string, step: LearnStep): string {
  return step.kind === "quiz"
    ? ROUTES.app.quiz(pathId, step.id)
    : ROUTES.app.lesson(pathId, step.id);
}

/**
 * "Previous" and "next", at the foot of every lesson and every exam.
 *
 * The targets come from the curriculum the sidebar is already rendering, so
 * "next" is always the row directly below — including when that row is an exam
 * rather than a lesson, which is exactly the moment a learner would otherwise
 * have to go hunting in the sidebar for what comes after a lesson.
 *
 * Arrow directions follow `design-system.md` §10: in RTL, back points right and
 * forward points left.
 */
export function LearnStepNav({
  pathId,
  previous,
  next,
}: {
  pathId: string;
  previous: LearnStep | null;
  next: LearnStep | null;
}) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="التنقل بين الدروس"
      className="flex flex-wrap items-stretch justify-between gap-3"
    >
      {previous ? (
        <StepButton pathId={pathId} step={previous} direction="previous" />
      ) : (
        <span />
      )}

      {next ? (
        <StepButton pathId={pathId} step={next} direction="next" />
      ) : null}
    </nav>
  );
}

function StepButton({
  pathId,
  step,
  direction,
}: {
  pathId: string;
  step: LearnStep;
  direction: "previous" | "next";
}) {
  const isNext = direction === "next";
  const StepIcon = step.kind === "quiz" ? ClipboardCheck : PlayCircle;

  return (
    <Button
      variant={isNext ? "default" : "outline"}
      size="lg"
      nativeButton={false}
      className="h-auto max-w-[48%] flex-col items-start gap-0.5 py-2 text-start"
      render={<Link href={stepHref(pathId, step)} />}
    >
      <span className="flex items-center gap-1 text-[0.7rem] opacity-80">
        {isNext ? (
          <>
            التالي
            <ArrowLeft className="size-3" />
          </>
        ) : (
          <>
            <ArrowRight className="size-3" />
            السابق
          </>
        )}
      </span>

      <span className="flex w-full min-w-0 items-center gap-1.5">
        <StepIcon className="size-3.5 shrink-0" />
        <span className="truncate text-sm font-medium">{step.title}</span>
      </span>
    </Button>
  );
}
