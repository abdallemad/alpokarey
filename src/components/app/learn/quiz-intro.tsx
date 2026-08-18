"use client";

import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  HelpCircle,
  Play,
  Target,
  XCircle,
} from "lucide-react";

import { EmptyState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { LearnQuiz } from "@/types/learn";
import { formatDateTime, formatNumber } from "@/utils/format";

/**
 * What a learner sees before starting: what this exam is, and how they have
 * done at it before.
 *
 * The exam does not open straight into question one on purpose. An attempt is
 * recorded, and a learner who lands here from a link deserves to know the
 * passing score and how many questions there are before they are counted as
 * having started.
 */
export function QuizIntro({
  quiz,
  pathId,
  onStart,
}: {
  quiz: LearnQuiz;
  pathId: string;
  onStart: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            {quiz.isFinal ? (
              <Badge className="border-transparent bg-gold/15 text-gold-foreground dark:text-gold">
                <Award />
                الاختبار النهائي للمرحلة
              </Badge>
            ) : (
              <Badge className="border-transparent bg-info/15 text-info">
                <ClipboardCheck />
                اختبار الدرس
              </Badge>
            )}

            {quiz.isPassed ? (
              <Badge className="border-transparent bg-success/15 text-success">
                <CheckCircle2 />
                اجتزته
              </Badge>
            ) : null}
          </div>

          <CardTitle className="font-heading text-xl font-bold">
            {quiz.title}
          </CardTitle>

          <p className="text-xs text-muted-foreground">
            المرحلة {formatNumber(quiz.stage.order)}: {quiz.stage.title}
            {quiz.lesson ? ` · درس: ${quiz.lesson.title}` : ""}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {quiz.description ? (
            <p className="text-sm leading-8 whitespace-pre-wrap text-muted-foreground">
              {quiz.description}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Figure
              icon={HelpCircle}
              label="عدد الأسئلة"
              value={formatNumber(quiz.questionsCount)}
            />
            <Figure
              icon={Target}
              label="درجة النجاح"
              value={`${formatNumber(quiz.passingScore)}%`}
            />
            <Figure
              icon={Clock}
              label="المدة"
              value={quiz.duration ?? "غير محددة"}
            />
            <Figure
              icon={Award}
              label="أفضل نتيجة"
              value={
                quiz.bestScore === null
                  ? "—"
                  : `${formatNumber(quiz.bestScore)}%`
              }
            />
          </div>

          {quiz.questionsCount === 0 ? (
            // An exam is refused activation with no questions, so this is a
            // hand-edited row rather than a normal state — but a dead "start"
            // button would be worse than saying what happened.
            <EmptyState
              icon={HelpCircle}
              title="لم تُضف أسئلة لهذا الاختبار بعد"
              description="سيصبح الاختبار متاحًا فور إضافة أسئلته."
              className="py-8"
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onStart}>
                <Play />
                {quiz.attemptsCount > 0 ? "إعادة المحاولة" : "ابدأ الاختبار"}
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
          )}

          {/* Retakes are unlimited — nothing in the model caps them — so saying
              so removes the fear that opening the exam spends something. */}
          <p className="text-xs text-muted-foreground">
            يمكنك إعادة الاختبار أكثر من مرة، وتُحفظ كل محاولة في سجلّك.
          </p>
        </CardContent>
      </Card>

      {quiz.attempts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">محاولاتك السابقة</CardTitle>
          </CardHeader>

          <CardContent>
            <ul className="space-y-2">
              {quiz.attempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    {attempt.isPassed ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <XCircle className="size-4 text-destructive" />
                    )}
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        attempt.isPassed ? "text-success" : "text-destructive",
                      )}
                    >
                      {formatNumber(attempt.score)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {attempt.isPassed ? "ناجح" : "لم يجتز"} · درجة النجاح{" "}
                      {formatNumber(quiz.passingScore)}%
                    </span>
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(attempt.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Figure({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Award;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 font-heading text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
