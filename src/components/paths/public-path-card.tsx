import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Award, BookOpen, ImageOff, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PATH_CATEGORY_CLASSES, PATH_CATEGORY_LABELS } from "@/constants/path";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { PublicPathSummary } from "@/types/path";
import { formatNumber } from "@/utils/format";
import { isStoredUploadPath } from "@/utils/upload";

/**
 * One published path, as a visitor sees it.
 *
 * Rendered by both the landing page's teaser section and `/paths`, from one
 * definition — the same reason `EnrolledPathCard` is shared by `/dashboard`
 * and `/dashboard/paths`: two copies of a card are two descriptions of the same
 * path that will eventually disagree about which figures it shows.
 *
 * It says three things and stops: what the path is, how big it is, and whether
 * it ends in a certificate. Everything else — the syllabus, the promo, the
 * enrol button — is on the page the button leads to, because a card that tries
 * to answer "should I study this?" stops being scannable.
 *
 * ### The cover image
 *
 * Rendered as the Card's **first child**, which is the affordance
 * `components/ui/card.tsx` already provides: it drops the card's top padding
 * and rounds the image's top corners for any `img` in that position, so the
 * picture is full-bleed without a single override here.
 *
 * `unoptimized` when the URL is not one of this app's own objects. New covers
 * are uploaded to `/uploads/<key>` and go through the Next.js optimiser, but
 * rows written before the upload field existed hold absolute Cloudinary links,
 * and optimising those would require a `remotePatterns` entry for every host
 * anyone ever pasted. See `docs/path-cover-images.md` §7.
 *
 * A path with no cover gets a muted placeholder rather than nothing, so a row
 * of cards keeps one baseline whether or not every path has a picture yet.
 *
 * A Server Component by default: nothing here is interactive beyond a link.
 */
export function PublicPathCard({ path }: { path: PublicPathSummary }) {
  return (
    <Card className="h-full">
      {path.imageUrl ? (
        <Image
          src={path.imageUrl}
          // Decorative: the title sits directly beneath it, so a screen reader
          // announcing the cover as well would only repeat the path's name.
          alt=""
          width={640}
          height={360}
          sizes="(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw"
          className="aspect-video w-full object-cover"
          unoptimized={!isStoredUploadPath(path.imageUrl)}
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-t-xl bg-muted">
          <ImageOff className="size-7 text-muted-foreground/50" />
        </div>
      )}

      <CardContent className="flex flex-1 flex-col gap-3">
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
          render={<Link href={ROUTES.path(path.id)} />}
        >
          تفاصيل المسار
          {/* Forward points left in RTL — design-system.md §10. */}
          <ArrowLeft />
        </Button>
      </CardContent>
    </Card>
  );
}

/** The card's own placeholder, so the two cannot drift out of the same shape. */
export function PublicPathCardSkeleton() {
  return (
    <Card className="h-full">
      <Skeleton className="aspect-video w-full rounded-none" />

      <CardContent className="flex flex-1 flex-col gap-3">
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
