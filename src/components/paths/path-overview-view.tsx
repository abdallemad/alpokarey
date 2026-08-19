"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Layers,
  Lock,
  Route,
} from "lucide-react";

import { EnrollButton } from "@/components/enrollment";
import { PathCurriculumOutline } from "@/components/paths/path-curriculum-outline";
import { PathOverviewSkeleton } from "@/components/paths/path-overview-skeleton";
import { ApiErrorState } from "@/components/shared";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PATH_CATEGORY_CLASSES, PATH_CATEGORY_LABELS } from "@/constants/path";
import { ROUTES } from "@/constants/routes";
import { usePathOverview } from "@/hooks/use-path-overview";
import { cn } from "@/lib/utils";
import type { PathOverview } from "@/types/path";
import { formatNumber } from "@/utils/format";
import { toYouTubeEmbedUrl } from "@/utils/video";

/**
 * `/paths/:pathId` — the page that answers "is this worth studying?", and then
 * lets the visitor act on the answer.
 *
 * One page for two audiences. A visitor with no account reads the pitch and
 * the syllabus and is offered a sign-up; an enrolled learner sees the same
 * document with their own progress in it and a way back into the player. The
 * server decides which of those someone is (`PathOverview.viewer`), so nothing
 * here asks Clerk — see `hooks/use-path-overview.ts`.
 *
 * A Client Component because of that `viewer`: the page varies per session, so
 * it could not be static anyway, and fetching it here keeps the enrolment
 * mutation, its cache invalidation and its redirect on one side of the
 * boundary.
 */
export function PathOverviewView({ pathId }: { pathId: string }) {
  const { data, isPending, isError, error, refetch } = usePathOverview(pathId);

  if (isPending) {
    return <PathOverviewSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <ApiErrorState
          error={error}
          title="تعذّر تحميل المسار"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const promoEmbedUrl = toYouTubeEmbedUrl(data.promoUrl);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2.5 text-muted-foreground"
        nativeButton={false}
        render={<Link href={`${ROUTES.home}#paths`} />}
      >
        {/* Back points right in RTL — design-system.md §10. */}
        <ArrowRight />
        كل المسارات
      </Button>

      <header className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {data.category ? (
            <Badge
              className={cn(
                "border-transparent",
                PATH_CATEGORY_CLASSES[data.category],
              )}
            >
              {PATH_CATEGORY_LABELS[data.category]}
            </Badge>
          ) : null}

          {data.certificationActivated ? (
            <Badge className="border-transparent bg-gold/15 text-gold-foreground dark:text-gold">
              <Award />
              بشهادة معتمدة
            </Badge>
          ) : null}

          {data.viewer.isCompleted ? (
            <Badge className="border-transparent bg-success/15 text-success">
              <CheckCircle2 />
              أتممت هذا المسار
            </Badge>
          ) : null}

          {/* Only an enrolled learner can be looking at an unpublished path —
              the endpoint 404s for everyone else — and they are owed the
              explanation rather than left wondering why nothing changes. */}
          {data.status === "DRAFT" ? (
            <Badge variant="secondary">
              <Lock />
              قيد الإعداد
            </Badge>
          ) : null}
        </div>

        <h1 className="font-heading text-3xl font-bold text-balance sm:text-4xl">
          {data.title}
        </h1>

        {data.description ? (
          <p className="max-w-2xl text-base leading-7 text-muted-foreground text-pretty">
            {data.description}
          </p>
        ) : null}

        <PathFacts path={data} />
      </header>

      <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {promoEmbedUrl ? (
            <AspectRatio
              ratio={16 / 9}
              className="overflow-hidden rounded-xl bg-black ring-1 ring-foreground/10"
            >
              <iframe
                src={promoEmbedUrl}
                title={data.title}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 size-full border-0"
              />
            </AspectRatio>
          ) : null}

          <section className="space-y-4">
            <div>
              <h2 className="font-heading text-2xl font-bold">محتوى المسار</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatNumber(data.stagesCount)} مرحلة، و
                {formatNumber(data.lessonsCount)} درسًا مرتّبة على التدرّج.
              </p>
            </div>

            <PathCurriculumOutline
              stages={data.stages}
              showProgress={data.viewer.isEnrolled}
            />
          </section>
        </div>

        {/* `sticky` from `lg` up only: on a phone the card is simply the last
            block of the page, and pinning it there would cover the syllabus it
            is asking the visitor to judge. */}
        <Card className="lg:sticky lg:top-20">
          <CardContent className="space-y-5">
            {data.viewer.isEnrolled ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {formatNumber(data.viewer.completedLessonsCount)} من{" "}
                    {formatNumber(data.lessonsCount)} درس
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatNumber(data.viewer.progress)}%
                  </span>
                </div>
                <Progress value={data.viewer.progress} />
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                {data.viewer.isSignedIn
                  ? "سجّل في المسار لتفتح دروسه وتتابع تقدّمك فيه درسًا بدرس."
                  : "أنشئ حسابك المجاني لتبدأ هذا المسار وتتابع تقدّمك فيه."}
              </p>
            )}

            <EnrollButton
              pathId={data.id}
              isSignedIn={data.viewer.isSignedIn}
              isEnrolled={data.viewer.isEnrolled}
              startLessonId={data.viewer.startLessonId}
              hasLessons={data.lessonsCount > 0}
            />

            {data.lessonsCount === 0 ? (
              <p className="text-center text-xs text-muted-foreground">
                لم تُضف دروس لهذا المسار بعد، ويُفتح للتسجيل فور اكتمال مراحله.
              </p>
            ) : null}

            <Separator />

            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Layers className="size-4 shrink-0 text-primary" />
                {formatNumber(data.stagesCount)} مرحلة متدرّجة
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="size-4 shrink-0 text-primary" />
                {formatNumber(data.lessonsCount)} درسًا
              </li>
              {data.quizzesCount > 0 ? (
                <li className="flex items-center gap-2">
                  <ClipboardList className="size-4 shrink-0 text-primary" />
                  {formatNumber(data.quizzesCount)} اختبارًا لقياس الفهم
                </li>
              ) : null}
              {data.certificationActivated ? (
                <li className="flex items-center gap-2">
                  <Award className="size-4 shrink-0 text-gold" />
                  شهادة إتمام عند إنهاء المسار
                </li>
              ) : null}
            </ul>

            {data.viewer.isEnrolled ? (
              <Button
                variant="outline"
                className="w-full"
                nativeButton={false}
                render={<Link href={ROUTES.app.paths} />}
              >
                <Route />
                كل مساراتي
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** The figures that size a path, under its description. */
function PathFacts({ path }: { path: PathOverview }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Layers className="size-4" />
        {formatNumber(path.stagesCount)} مرحلة
      </span>
      <span className="flex items-center gap-1.5">
        <BookOpen className="size-4" />
        {formatNumber(path.lessonsCount)} درس
      </span>
      {path.quizzesCount > 0 ? (
        <span className="flex items-center gap-1.5">
          <ClipboardList className="size-4" />
          {formatNumber(path.quizzesCount)} اختبار
        </span>
      ) : null}
      {path.certificationActivated ? (
        <span className="flex items-center gap-1.5">
          <Award className="size-4" />
          شهادة عند الإتمام
        </span>
      ) : null}
    </div>
  );
}
