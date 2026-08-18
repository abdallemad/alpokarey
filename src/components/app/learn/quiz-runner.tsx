"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";

import { QuizQuestionCard } from "@/components/app/learn/quiz-question-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { LearnQuiz } from "@/types/learn";
import { formatNumber } from "@/utils/format";
import { toProgressPercent } from "@/utils/progress";

/**
 * The player's third part: sitting the exam.
 *
 * One question at a time, not a long scroll of all of them. A single question
 * on screen is the whole of what a learner has to think about at that moment,
 * and the numbered row underneath still lets them jump anywhere — so nothing is
 * hidden, it is just not all shouting at once.
 *
 * Answers live here rather than in a cache: they belong to an attempt that does
 * not exist yet. Leaving the page loses them, which is the same contract as
 * every exam hall, and far better than a half-answered draft resurfacing weeks
 * later as if it were in progress.
 */
export function QuizRunner({
  quiz,
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  quiz: LearnQuiz;
  isSubmitting: boolean;
  onSubmit: (answers: { questionId: string; optionId: string }[]) => void;
  onCancel: () => void;
}) {
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [isConfirmOpen, setConfirmOpen] = React.useState(false);

  const question = quiz.questions[index];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = quiz.questions.length - answeredCount;
  const isLast = index === quiz.questions.length - 1;

  const select = (optionId: string) => {
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
  };

  const submit = () => {
    setConfirmOpen(false);
    onSubmit(
      Object.entries(answers).map(([questionId, optionId]) => ({
        questionId,
        optionId,
      })),
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-medium">{quiz.title}</span>
          <span className="text-muted-foreground tabular-nums">
            أجبت عن {formatNumber(answeredCount)} من{" "}
            {formatNumber(quiz.questions.length)}
          </span>
        </div>

        <Progress
          value={toProgressPercent(answeredCount, quiz.questions.length)}
        />

        {/* The map of the exam: answered, current, untouched — and a way back to
            any of them. Without it, "question 7 of 20" is a countdown with no
            way to revisit question 3. */}
        <ol className="flex flex-wrap gap-1.5 pt-1">
          {quiz.questions.map((item, itemIndex) => {
            const isAnswered = Boolean(answers[item.id]);
            const isCurrent = itemIndex === index;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  aria-label={`السؤال ${formatNumber(itemIndex + 1)}`}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "size-7 rounded-md border text-xs tabular-nums transition-colors",
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground"
                      : isAnswered
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {formatNumber(itemIndex + 1)}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <QuizQuestionCard
        question={question}
        index={index}
        total={quiz.questions.length}
        selectedOptionId={answers[question.id] ?? null}
        onSelect={select}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={index === 0}
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
          >
            <ArrowRight />
            السابق
          </Button>

          <Button
            variant="outline"
            disabled={isLast}
            onClick={() =>
              setIndex((current) =>
                Math.min(quiz.questions.length - 1, current + 1),
              )
            }
          >
            التالي
            <ArrowLeft />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            إلغاء
          </Button>

          <Button onClick={() => setConfirmOpen(true)} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
            تسليم الإجابات
          </Button>
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تسليم الاختبار</AlertDialogTitle>
            <AlertDialogDescription>
              {/* Unanswered questions are graded as wrong rather than blocking
                  the submission — a learner who does not know an answer should
                  not be trapped on the page. Saying so before they commit is
                  the part that matters. */}
              {unansweredCount > 0
                ? `لم تُجب عن ${formatNumber(unansweredCount)} سؤال، وستُحتسب إجابات خاطئة. هل تريد التسليم الآن؟`
                : "سيتم تصحيح إجاباتك وتسجيل المحاولة. هل تريد المتابعة؟"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>مراجعة الإجابات</AlertDialogCancel>
            <AlertDialogAction onClick={submit}>تسليم</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
