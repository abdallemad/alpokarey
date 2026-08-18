"use client";

import Link from "next/link";
import { Award, CheckCircle2, ClipboardCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { LearnQuizSummary } from "@/types/learn";
import { formatNumber } from "@/utils/format";

type CurriculumQuizItemProps = {
  quiz: LearnQuizSummary;
  pathId: string;
  isActive: boolean;
  onNavigate?: () => void;
};

/**
 * An exam in the curriculum tree — a **lesson's** exam.
 *
 * Rendered indented, directly beneath the lesson it tests, with a rule down the
 * start edge tying the two together. That grouping is the whole point: an exam
 * listed as a sibling of the lessons reads as one more thing to study, when it
 * is really a gate on the thing above it.
 */
export function CurriculumQuizItem({
  quiz,
  pathId,
  isActive,
  onNavigate,
}: CurriculumQuizItemProps) {
  return (
    <li className="ms-3 border-s border-border ps-3">
      <Link
        href={ROUTES.app.quiz(pathId, quiz.id)}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
          isActive
            ? "bg-primary/10 font-medium text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {quiz.isPassed ? (
          <CheckCircle2 className="size-3.5 shrink-0 text-success" />
        ) : (
          <ClipboardCheck className="size-3.5 shrink-0" />
        )}

        <span className="min-w-0 flex-1 truncate">{quiz.title}</span>

        <QuizScoreBadge quiz={quiz} />
      </Link>
    </li>
  );
}

/**
 * The stage's final exam.
 *
 * Set apart on purpose: it closes the stage rather than belonging to any lesson
 * in it, and it is the exam a certificate would rest on. It gets the `--gold`
 * achievement token, a border of its own and a label saying what it is —
 * `docs/design-system.md` §2.2 reserves that token for exactly this.
 */
export function CurriculumFinalQuizItem({
  quiz,
  pathId,
  isActive,
  onNavigate,
}: CurriculumQuizItemProps) {
  return (
    <li className="mt-1">
      <Link
        href={ROUTES.app.quiz(pathId, quiz.id)}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-start gap-2 rounded-lg border border-dashed px-2.5 py-2 text-xs transition-colors",
          isActive
            ? "border-gold bg-gold/15 text-gold-foreground dark:text-gold"
            : "border-gold/40 bg-gold/5 text-foreground hover:bg-gold/10",
        )}
      >
        {quiz.isPassed ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
        ) : (
          <Award className="mt-0.5 size-4 shrink-0 text-gold" />
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{quiz.title}</span>
          <span className="mt-0.5 block text-[0.7rem] text-muted-foreground">
            الاختبار النهائي للمرحلة · النجاح من{" "}
            {formatNumber(quiz.passingScore)}%
          </span>
        </span>

        <QuizScoreBadge quiz={quiz} />
      </Link>
    </li>
  );
}

/**
 * The learner's standing with this exam, in one badge.
 *
 * A score with no verdict beside it means nothing — 70% is a pass in one exam
 * and a fail in the next — so the badge carries the colour of the verdict and
 * the number together, and says nothing at all before the first attempt.
 */
function QuizScoreBadge({ quiz }: { quiz: LearnQuizSummary }) {
  if (quiz.bestScore === null) return null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "shrink-0 border-transparent tabular-nums",
        quiz.isPassed
          ? "bg-success/15 text-success"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {formatNumber(quiz.bestScore)}%
    </Badge>
  );
}
