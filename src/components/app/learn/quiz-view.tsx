"use client";

import * as React from "react";

import { LearnStepNav } from "@/components/app/learn/learn-step-nav";
import { QuizViewSkeleton } from "@/components/app/learn/learn-skeletons";
import { QuizIntro } from "@/components/app/learn/quiz-intro";
import { QuizResult } from "@/components/app/learn/quiz-result";
import { QuizRunner } from "@/components/app/learn/quiz-runner";
import { ApiErrorState } from "@/components/shared";
import { useCurriculum } from "@/hooks/use-curriculum";
import { useLearnQuiz } from "@/hooks/use-learn-quiz";
import { useQuizAttempt } from "@/hooks/use-quiz-attempt";
import type { QuizAttemptResult } from "@/types/learn";
import { findNeighbours, toSteps } from "@/utils/curriculum";

/**
 * The exam area — three screens behind one route.
 *
 * `intro` → `running` → `result`, and back to `running` on a retake. They are
 * phases of one activity rather than three destinations: a learner mid-exam who
 * pressed the browser's back button expecting to return to question 4 and
 * landed on the lesson instead would have lost the attempt, so the browser
 * history stays out of it.
 *
 * The graded result lives here rather than in the query cache. It describes one
 * attempt, not the exam, and caching it would mean a learner returning to the
 * exam a week later meets an old verdict instead of the start screen.
 */
type Phase = "intro" | "running" | "result";

export function QuizView({
  pathId,
  quizId,
}: {
  pathId: string;
  quizId: string;
}) {
  const { data: curriculum } = useCurriculum(pathId);
  const {
    data: quiz,
    isPending,
    isError,
    error,
    refetch,
  } = useLearnQuiz(pathId, quizId);
  const attempt = useQuizAttempt(pathId, quizId);

  const [phase, setPhase] = React.useState<Phase>("intro");
  const [result, setResult] = React.useState<QuizAttemptResult | null>(null);

  if (isPending) {
    return <QuizViewSkeleton />;
  }

  if (isError) {
    return (
      <ApiErrorState
        error={error}
        title="تعذّر تحميل الاختبار"
        onRetry={() => refetch()}
      />
    );
  }

  const { previous, next } = findNeighbours(
    curriculum ? toSteps(curriculum.stages) : [],
    "quiz",
    quizId,
  );

  const submit = (answers: { questionId: string; optionId: string }[]) => {
    attempt.mutate(
      { answers },
      {
        onSuccess: (graded) => {
          setResult(graded);
          setPhase("result");
        },
        // A failed submission keeps the learner in the runner with their
        // answers intact; the hook has already explained why in a toast.
      },
    );
  };

  return (
    <div className="space-y-4">
      {phase === "running" ? (
        <QuizRunner
          quiz={quiz}
          isSubmitting={attempt.isPending}
          onSubmit={submit}
          onCancel={() => setPhase("intro")}
        />
      ) : phase === "result" && result ? (
        <QuizResult
          quiz={quiz}
          pathId={pathId}
          result={result}
          onRetry={() => {
            setResult(null);
            setPhase("running");
          }}
        />
      ) : (
        <QuizIntro
          quiz={quiz}
          pathId={pathId}
          onStart={() => setPhase("running")}
        />
      )}

      {/* Hidden while the exam is open: every one of these links would discard
          the answers on screen. */}
      {phase === "running" ? null : (
        <LearnStepNav pathId={pathId} previous={previous} next={next} />
      )}
    </div>
  );
}
