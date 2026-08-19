"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Layers,
  Lock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  PATH_CATEGORY_CLASSES,
  PATH_CATEGORY_LABELS,
} from "@/constants/path";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { EnrolledPath } from "@/types/student";
import { formatNumber } from "@/utils/format";

/**
 * One enrolled path, with everything the learner needs to decide whether to
 * open it: how far along they are, what comes next, and whether it is done.
 *
 * The next lesson is named rather than implied. "Continue" as a bare button
 * asks the learner to remember where they were; naming the lesson means they
 * do not have to.
 *
 * Rendered by both `/dashboard` and `/paths` — one card definition, so the two
 * screens cannot disagree about a path the learner sees on each of them.
 */
export function EnrolledPathCard({ path }: { path: EnrolledPath }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base font-bold">{path.title}</h3>

              {path.category ? (
                <Badge
                  className={cn(
                    "border-transparent",
                    PATH_CATEGORY_CLASSES[path.category],
                  )}
                >
                  {PATH_CATEGORY_LABELS[path.category]}
                </Badge>
              ) : null}

              {path.isCompleted ? (
                <Badge className="border-transparent bg-success/15 text-success">
                  <CheckCircle2 />
                  مكتمل
                </Badge>
              ) : null}

              {path.hasCertificate ? (
                <Badge className="border-transparent bg-gold/15 text-gold-foreground dark:text-gold">
                  <Award />
                  شهادة
                </Badge>
              ) : null}

              {/* An enrolment outlives its path being unpublished. Saying so is
                  better than leaving the learner to wonder why the content
                  stopped changing. */}
              {path.status === "DRAFT" ? (
                <Badge variant="secondary">
                  <Lock />
                  قيد الإعداد
                </Badge>
              ) : null}
            </div>

            {path.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {path.description}
              </p>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            className="shrink-0"
            render={<Link href={ROUTES.path(path.id)} />}
          >
            تفاصيل المسار
            <ArrowLeft />
          </Button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {formatNumber(path.completedLessonsCount)} من{" "}
              {formatNumber(path.lessonsCount)} درس
            </span>
            <span className="font-medium tabular-nums">
              {formatNumber(path.progress)}%
            </span>
          </div>
          <Progress value={path.progress} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Layers className="size-3.5" />
            {formatNumber(path.stagesCount)} مرحلة
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="size-3.5" />
            {formatNumber(path.lessonsCount)} درس
          </span>
          {path.certificationActivated ? (
            <span className="inline-flex items-center gap-1">
              <Award className="size-3.5" />
              شهادة عند الإتمام
            </span>
          ) : null}
        </div>

        {path.nextLesson ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/60 p-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">الدرس التالي</p>
              <p className="mt-0.5 truncate text-sm font-medium">
                {path.nextLesson.title}
              </p>
              <p className="text-xs text-muted-foreground">
                المرحلة {formatNumber(path.nextLesson.stageOrder)}:{" "}
                {path.nextLesson.stageTitle}
              </p>
            </div>

            <Button
              size="sm"
              nativeButton={false}
              className="shrink-0"
              render={
                <Link href={ROUTES.app.lesson(path.id, path.nextLesson.id)} />
              }
            >
              متابعة
              <ArrowLeft />
            </Button>
          </div>
        ) : path.lessonsCount === 0 ? (
          // An enrolled path with no lessons is the academy's gap, not the
          // learner's — say so rather than showing 0% with no way forward.
          <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            لم تُضف دروس لهذا المسار بعد. سيظهر المحتوى هنا فور نشره.
          </p>
        ) : (
          <p className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-xs text-success">
            <CheckCircle2 className="size-4 shrink-0" />
            أتممت جميع دروس هذا المسار. بارك الله فيك.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
