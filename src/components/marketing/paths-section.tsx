"use client";

import Link from "next/link";
import { ArrowLeft, Compass, Users } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/marketing/marketing-section";
import { PublicPathCard, PublicPathCardSkeleton } from "@/components/paths";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MARKETING_PATHS } from "@/constants/marketing";
import { PATH_CATEGORY_CLASSES, PATH_CATEGORY_LABELS } from "@/constants/path";
import { ROUTES } from "@/constants/routes";
import { usePublishedPaths } from "@/hooks/use-public-paths";
import { cn } from "@/lib/utils";

/**
 * The paths section — the academy's real catalog, or its plan when there is
 * none yet.
 *
 * ### Two states, one section
 *
 * **Published paths exist** → each is a real card from the database, with its
 * stage and lesson counts, and a "تفاصيل المسار" link to `/paths/:id`. Below
 * them, a link to the full catalog at `/paths`.
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
 * ### A teaser, not the catalog
 *
 * It shows at most `PUBLIC_PATHS_TEASER_LIMIT` cards — the first page of the
 * featured ordering, from the very endpoint `/paths` reads. A landing page is a
 * pitch, not an index: past six cards a visitor is scrolling a list instead of
 * following an argument. Anyone who wants the list has a link to it.
 *
 * A Client Component, because the catalog is the one part of this page that
 * changes between deploys. Fetching it here keeps `/` static — see
 * `hooks/use-public-paths.ts`.
 *
 * A failed request falls through to the planned list rather than showing an
 * error: a visitor does not need to know an endpoint is down, and the section
 * still says something true either way.
 */
export function PathsSection() {
  const { data, isPending } = usePublishedPaths();

  const publishedPaths = data?.items ?? [];
  const hasPublished = publishedPaths.length > 0;
  // The endpoint's own count, not the number of cards shown — "استعرض كل
  // المسارات (١٢)" has to mean the catalog, not this section.
  const totalPublished = data?.total ?? 0;

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
            <PublicPathCardSkeleton key={index} />
          ))
        ) : hasPublished ? (
          publishedPaths.map((path) => (
            <PublicPathCard key={path.id} path={path} />
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

      {/* Only when there is a catalog to browse. Offering "كل المسارات" while
          the grid is showing planned curricula would send a visitor to an
          empty page. */}
      {hasPublished ? (
        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<Link href={ROUTES.paths} />}
          >
            استعرض كل المسارات
            {totalPublished > publishedPaths.length
              ? ` (${totalPublished})`
              : null}
            {/* Forward points left in RTL — design-system.md §10. */}
            <ArrowLeft />
          </Button>
        </div>
      ) : null}

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
