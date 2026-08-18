"use client";

import Link from "next/link";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { LearnQuiz, QuizAttemptResult } from "@/types/learn";
import { formatNumber } from "@/utils/format";

/**
 * The verdict, and why.
 *
 * The score is stated **with the passing score beside it**, always: "70%" means
 * nothing on its own, and a learner who reads a bare number has to go looking
 * for the threshold to know how they did — the same reasoning the dashboard's
 * attempt list follows.
 *
 * The review below it is the reason this screen exists. An exam that reports a
 * number and nothing else teaches nobody anything, so every question is listed
 * with what the learner chose and what was correct.
 */
export function QuizResult({
  quiz,
  pathId,
  result,
  onRetry,
}: {
  quiz: LearnQuiz;
  pathId: string;
  result: QuizAttemptResult;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl",
                result.isPassed
                  ? "bg-success/15 text-success"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {result.isPassed ? (
                <CheckCircle2 className="size-7" />
              ) : (
                <XCircle className="size-7" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-heading text-xl font-bold">
                {result.isPassed
                  ? "اجتزت الاختبار، بارك الله فيك"
                  : "لم تبلغ درجة النجاح هذه المرة"}
              </p>
              <p className="text-sm text-muted-foreground">
                أجبت إجابة صحيحة عن {formatNumber(result.correctCount)} من{" "}
                {formatNumber(result.questionsCount)} سؤال · درجة النجاح{" "}
                {formatNumber(result.passingScore)}%
              </p>
            </div>

            <p
              className={cn(
                "font-heading text-3xl font-bold tabular-nums",
                result.isPassed ? "text-success" : "text-destructive",
              )}
            >
              {formatNumber(result.score)}%
            </p>
          </div>

          <Progress value={result.score} />

          <div className="flex flex-wrap items-center gap-2">
            <Button variant={result.isPassed ? "outline" : "default"} onClick={onRetry}>
              <RotateCcw />
              إعادة المحاولة
            </Button>

            {quiz.lesson ? (
              <Button
                variant="outline"
                nativeButton={false}
                render={
                  <Link href={ROUTES.app.lesson(pathId, quiz.lesson.id)} />
                }
              >
                العودة إلى الدرس
              </Button>
            ) : null}
          </div>

          {!result.isPassed ? (
            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              راجع الدرس ثم أعد المحاولة — عدد المحاولات غير محدود، وتُحتسب لك
              أفضل نتيجة.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">مراجعة الإجابات</CardTitle>
        </CardHeader>

        <CardContent>
          <ol className="space-y-3">
            {result.review.map((item, index) => (
              <li
                key={item.questionId}
                className={cn(
                  "rounded-lg border p-3",
                  item.isCorrect
                    ? "border-success/40 bg-success/5"
                    : "border-destructive/40 bg-destructive/5",
                )}
              >
                <div className="flex items-start gap-2">
                  {item.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  )}

                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-medium">
                      {formatNumber(index + 1)}. {item.questionText}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      إجابتك:{" "}
                      {item.selectedOptionText ? (
                        <span className="text-foreground">
                          {item.selectedOptionText}
                        </span>
                      ) : (
                        <Badge variant="secondary">لم تُجب</Badge>
                      )}
                    </p>

                    {/* Only shown when it adds something: repeating the right
                        answer under a correct one is noise. */}
                    {!item.isCorrect && item.correctOptionText ? (
                      <p className="text-xs text-muted-foreground">
                        الإجابة الصحيحة:{" "}
                        <span className="font-medium text-success">
                          {item.correctOptionText}
                        </span>
                      </p>
                    ) : null}

                    {/* A question the admin never marked an answer for. Saying
                        so is fairer than letting the learner think they chose
                        wrongly — see `services/quiz.service.ts`. */}
                    {!item.correctOptionId ? (
                      <p className="text-xs text-warning">
                        لم تُحدَّد إجابة صحيحة لهذا السؤال بعد.
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
