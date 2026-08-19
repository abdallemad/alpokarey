"use client";

import Link from "next/link";
import { ArrowLeft, Award, BookOpen, Compass, Layers, Users } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/marketing/marketing-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETING_PATHS } from "@/constants/marketing";
import { PATH_CATEGORY_CLASSES, PATH_CATEGORY_LABELS } from "@/constants/path";
import { ROUTES } from "@/constants/routes";
import { usePublishedPaths } from "@/hooks/use-published-paths";
import { cn } from "@/lib/utils";
import type { PublicPathSummary } from "@/types/path";
import { formatNumber } from "@/utils/format";

/**
 * The paths section — the academy's real catalog, or its plan when there is
 * none yet.
 *
 * ### Two states, one section
 *
 * **Published paths exist** → each is a real card from the database, with its
 * stage and lesson counts, and a "تفاصيل المسار" link to `/paths/:id`.
 *
 * **Nothing is published yet** → the section falls back to the priority paths
 * of `business-analysis.md` §3.4, as *plans*: no detail links, and a note
 * saying the curricula are being prepared. §1 records the project as being in
 * early founding, so this is the honest state today and probably the state on
 * launch day. A landing page whose main section renders empty because the
 * catalog is empty is a page that looks broken rather than early.
 *
 * §3.4 recommends those specific subjects — السنة والاقتصاد, السنة والطب —
 * because the market is not saturated with them, an approach its own analysis
 * names a **Blue Ocean** strategy. So even the fallback is the actual plan
 * rather than filler.
 *
 * A Client Component, because the catalog is the one part of this page that
 * changes between deploys. Fetching it here keeps `/` static — see
 * `hooks/use-published-paths.ts`.
 *
 * A failed request falls through to the planned list rather than showing an
 * error: a visitor does not need to know an endpoint is down, and the section
 * still says something true either way.
 */
export function PathsSection() {
  const { data, isPending } = usePublishedPaths();

  const publishedPaths = data ?? [];
  const hasPublished = publishedPaths.length > 0;

  return (
    <MarketingSection id="paths">
      <MarketingSectionHeading
        eyebrow="المسارات"
        title={hasPublished ? "المسارات المتاحة الآن" : "نبدأ من حيث يحتاج الناس"}
        description={
          hasPublished
            ? "ابدأ بأي مسارٍ منها، وتدرّج في مراحله حتى تُتمّه وتنال شهادته."
            : "مسارات مختارة لأن الحاجة إليها قائمة والمكتبة الدعوية لم تستوفها بعد."
        }
      />

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isPending ? (
          Array.from({ length: 3 }, (_, index) => (
            <PathCardSkeleton key={index} />
          ))
        ) : hasPublished ? (
          publishedPaths.map((path) => (
            <PublishedPathCard key={path.id} path={path} />
          ))
        ) : (
          MARKETING_PATHS.map((path) => (
            <Card key={path.title} className="h-full">
              <CardContent className="flex h-full flex-col gap-3">
                <Badge
                  className={cn(
                    "w-fit border-transparent",
                    PATH_CATEGORY_CLASSES[path.category],
                  )}
                >
                  {PATH_CATEGORY_LABELS[path.category]}
                </Badge>

                <h3 className="font-heading text-xl font-bold">{path.title}</h3>

                <p className="flex-1 text-sm leading-6 text-muted-foreground">
                  {path.description}
                </p>

                <p className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {path.audience}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Only when there is nothing to enrol in. Once paths are published the
          cards themselves are the call to action, and this note would be
          contradicting the six live courses above it. */}
      {!isPending && !hasPublished ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-xl bg-muted/60 px-6 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Compass className="size-5" />
          </span>

          <p className="max-w-xl text-sm leading-6 text-muted-foreground text-pretty">
            المناهج قيد الإعداد، ويُفتح كل مسار للتسجيل فور اكتمال مراحله. أنشئ
            حسابك الآن ليصلك أول مسار عند إطلاقه.
          </p>

          <Button nativeButton={false} render={<Link href={ROUTES.signUp} />}>
            أنشئ حسابك
          </Button>
        </div>
      ) : null}
    </MarketingSection>
  );
}

/** One published path, as a visitor sees it. */
function PublishedPathCard({ path }: { path: PublicPathSummary }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
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

          {path.certificationActivated ? (
            <Badge className="border-transparent bg-gold/15 text-gold-foreground dark:text-gold">
              <Award />
              بشهادة
            </Badge>
          ) : null}
        </div>

        <h3 className="font-heading text-xl font-bold">{path.title}</h3>

        {path.description ? (
          <p className="line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
            {path.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Layers className="size-3.5" />
            {formatNumber(path.stagesCount)} مرحلة
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="size-3.5" />
            {formatNumber(path.lessonsCount)} درس
          </span>
        </div>

        <Button
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={<Link href={ROUTES.app.path(path.id)} />}
        >
          تفاصيل المسار
          {/* Forward points left in RTL — design-system.md §10. */}
          <ArrowLeft />
        </Button>
      </CardContent>
    </Card>
  );
}

function PathCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3">
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="mt-auto space-y-3 border-t border-border pt-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
