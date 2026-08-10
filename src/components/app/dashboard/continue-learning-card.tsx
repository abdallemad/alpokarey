"use client";

import Link from "next/link";
import { ArrowLeft, Layers, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import type { StudentDashboard } from "@/types/student";
import { formatNumber } from "@/utils/format";

/**
 * "Resume here" — the single most useful control on the dashboard.
 *
 * A learner returning to the academy has one question, and it is not "how am I
 * doing overall"; it is "where was I?". This answers it in one click, and it
 * names the lesson and its stage so the answer is recognisable rather than a
 * bare button.
 *
 * It uses `--primary` at full strength — the only block on the page that does
 * — because there should be no ambiguity about the primary action.
 */
export function ContinueLearningCard({
  continueLesson,
}: {
  continueLesson: NonNullable<StudentDashboard["continueLesson"]>;
}) {
  return (
    <Card className="border-transparent bg-primary text-primary-foreground">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
          <PlayCircle className="size-6" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs opacity-80">أكمل من حيث توقفت</p>
          <p className="mt-0.5 font-heading text-lg font-bold">
            {continueLesson.title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs opacity-90">
            <span>{continueLesson.pathTitle}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Layers className="size-3.5" />
              المرحلة {formatNumber(continueLesson.stageOrder)}:{" "}
              {continueLesson.stageTitle}
            </span>
            <span aria-hidden>·</span>
            <span>الدرس {formatNumber(continueLesson.order)}</span>
          </p>
        </div>

        <Button
          variant="secondary"
          nativeButton={false}
          className="shrink-0"
          render={
            <Link
              href={ROUTES.app.lesson(
                continueLesson.pathId,
                continueLesson.id,
              )}
            />
          }
        >
          متابعة الدرس
          <ArrowLeft />
        </Button>
      </CardContent>
    </Card>
  );
}
