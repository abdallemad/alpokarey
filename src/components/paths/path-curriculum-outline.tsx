"use client";

import { BookOpen, CheckCircle2, Circle, ClipboardList, FileText, Layers, Video } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PathOverviewStage } from "@/types/path";
import { formatNumber } from "@/utils/format";

/**
 * What a learner would actually study, stage by stage.
 *
 * The counterpart of the player's `CurriculumTree`, and deliberately **not**
 * the same component. That one is navigation — every row is a link, and it
 * only ever renders for someone already enrolled. This one is a *table of
 * contents*: nothing is clickable, because for most of its audience nothing is
 * open yet, and a link that leads to a refusal is worse than no link.
 *
 * Lesson titles are shown to everyone, enrolled or not. A course page that
 * hides its syllabus asks a visitor to buy something unseen; the titles are the
 * pitch, and the content behind them is what enrolment is for.
 *
 * The first stage is open by default and the rest are closed: the first stage
 * shows the shape of the thing without the page opening on forty rows.
 */
export function PathCurriculumOutline({
  stages,
  /** Only true for an enrolled viewer — see `PathOverviewLesson.isCompleted`. */
  showProgress,
}: {
  stages: PathOverviewStage[];
  showProgress: boolean;
}) {
  if (stages.length === 0) {
    return (
      <p className="rounded-xl bg-muted/60 p-6 text-center text-sm text-muted-foreground">
        لم تُضف مراحل لهذا المسار بعد. سيظهر المحتوى هنا فور نشره.
      </p>
    );
  }

  return (
    <Accordion
      multiple
      defaultValue={[stages[0].id]}
      className="divide-y divide-border overflow-hidden rounded-xl border border-border"
    >
      {stages.map((stage) => {
        const completedCount = stage.lessons.filter(
          (lesson) => lesson.isCompleted,
        ).length;

        return (
          <AccordionItem
            key={stage.id}
            value={stage.id}
            className="border-none px-4"
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              <span className="flex min-w-0 flex-1 flex-col gap-1.5 pe-3 text-start">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Layers className="size-3.5" />
                  المرحلة {formatNumber(stage.order)}
                </span>

                <span className="font-heading text-base font-bold text-pretty">
                  {stage.title}
                </span>

                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="size-3.5" />
                    {showProgress
                      ? `${formatNumber(completedCount)} من ${formatNumber(stage.lessonsCount)} درس`
                      : `${formatNumber(stage.lessonsCount)} درس`}
                  </span>

                  {stage.quizzesCount > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="size-3.5" />
                      {formatNumber(stage.quizzesCount)} اختبار
                    </span>
                  ) : null}

                  {showProgress &&
                  stage.lessonsCount > 0 &&
                  completedCount === stage.lessonsCount ? (
                    <Badge className="border-transparent bg-success/15 text-success">
                      مكتملة
                    </Badge>
                  ) : null}
                </span>
              </span>
            </AccordionTrigger>

            <AccordionContent className="pb-4">
              <ul className="space-y-1">
                {stage.lessons.map((lesson) => {
                  const Icon = lesson.type === "VIDEO" ? Video : FileText;

                  return (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm"
                    >
                      {showProgress ? (
                        lesson.isCompleted ? (
                          <CheckCircle2 className="size-4 shrink-0 text-success" />
                        ) : (
                          <Circle className="size-4 shrink-0 text-muted-foreground/60" />
                        )
                      ) : (
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                      )}

                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate",
                          lesson.isCompleted && "text-muted-foreground",
                        )}
                      >
                        {lesson.title}
                      </span>

                      {/* The type icon moves to the end once the start of the
                          row is carrying a tick, so both are still visible. */}
                      {showProgress ? (
                        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                      ) : null}

                      {lesson.duration ? (
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {lesson.duration}
                        </span>
                      ) : null}
                    </li>
                  );
                })}

                {stage.lessons.length === 0 ? (
                  <li className="px-2 py-2 text-sm text-muted-foreground">
                    لا توجد دروس في هذه المرحلة بعد.
                  </li>
                ) : null}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
