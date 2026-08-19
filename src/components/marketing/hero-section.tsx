import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ACADEMY_MISSION,
  ACADEMY_OUTCOMES,
  ACADEMY_VISION_PARTS,
} from "@/constants/marketing";
import { ROUTES } from "@/constants/routes";

/**
 * The first screen: the vision, the mission, and one thing to do.
 *
 * The headline is the academy's vision **verbatim** — `business-analysis.md`
 * §2.1, "جيلٌ ربانيٌّ يُحيي السنة". A landing page is usually where a good
 * strapline gets replaced by a worse invented one; this one already exists, has
 * been agreed, and is better than anything a page could make up.
 *
 * "يُحيي السنة" carries `--primary` alone. The emerald is the scholarly-heritage
 * token (`design-system.md` §2.1), and putting it on the half of the sentence
 * that states the purpose is the whole use of an accent colour.
 *
 * The four ticks beneath are §2.1's outcomes — what "جيل رباني" would actually
 * consist of. They stand in for the usual hero statistics strip, which this
 * project cannot honestly fill: §1 records the academy as being in early
 * founding, so there are no student counts or course totals to print.
 *
 * The decorative field is two blurred radial washes at low opacity, not an
 * image: no asset to ship, no `next/image` layout shift, and it re-tints itself
 * in dark mode because it is built from the same two tokens.
 */
export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* `aria-hidden` — it is texture, and a screen reader should not have to
          hear about it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_0%,var(--primary)_0%,transparent_60%),radial-gradient(45%_40%_at_20%_10%,var(--gold)_0%,transparent_55%)] opacity-[0.09] dark:opacity-[0.14]"
      />

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-16 sm:px-6 sm:pt-24 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="rounded-full border-primary/25 bg-primary/10 px-3 py-1 text-primary"
          >
            <Sparkles />
            منصّة تعليمية لخدمة السنة النبوية
          </Badge>

          <h1 className="mt-6 font-heading text-4xl leading-tight font-bold text-balance sm:text-5xl lg:text-6xl">
            {ACADEMY_VISION_PARTS[0]}{" "}
            <span className="text-primary">{ACADEMY_VISION_PARTS[1]}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground text-pretty sm:text-lg">
            {ACADEMY_MISSION}
          </p>

          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            {/* Base UI, not Radix: a Button that renders an anchor takes
                `render` plus `nativeButton={false}` — see
                docs/paths-feature.md §13. */}
            <Button
              size="lg"
              className="h-12 px-7 text-base"
              nativeButton={false}
              render={<Link href={ROUTES.signUp} />}
            >
              ابدأ رحلتك العلمية
              {/* Forward points left in RTL — design-system.md §10. */}
              <ArrowLeft />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-12 px-7 text-base"
              nativeButton={false}
              render={<Link href={ROUTES.paths} />}
            >
              تصفّح المسارات
            </Button>
          </div>

          <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-3">
            {ACADEMY_OUTCOMES.map((outcome) => (
              <li
                key={outcome}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <Check className="size-4 shrink-0 text-primary" />
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
