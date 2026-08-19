import { Check } from "lucide-react";

import { MarketingSection } from "@/components/marketing/marketing-section";
import {
  ACADEMY_MISSION,
  ACADEMY_OUTCOMES,
  ACADEMY_VISION_PARTS,
} from "@/constants/marketing";

/**
 * `/about`'s opening — the vision, the mission, and what the project actually
 * is.
 *
 * The landing page's hero makes the same claim in three words and then moves
 * on to the argument; this page is where the claim gets its paragraphs. Both
 * read `ACADEMY_VISION_PARTS` and `ACADEMY_MISSION` from
 * `constants/marketing.ts`, so the academy cannot describe itself two ways on
 * two pages.
 *
 * The four outcomes are `business-analysis.md` §2.1's own gloss on the vision:
 * "جيل رباني" is a claim, and these are the things that would make it true.
 * They are listed rather than prosed because a visitor scanning this page reads
 * exactly one of them.
 */
export function AboutIntro() {
  const [visionLead, visionTail] = ACADEMY_VISION_PARTS;

  return (
    <MarketingSection id="intro" className="pb-8 sm:pb-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-primary">عن الأكاديمية</p>

        <h1 className="mt-3 font-heading text-4xl font-bold text-balance sm:text-5xl">
          {visionLead} <span className="text-primary">{visionTail}</span>
        </h1>

        <p className="mt-6 text-base leading-8 text-muted-foreground text-pretty sm:text-lg">
          {ACADEMY_MISSION}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <h2 className="font-heading text-2xl font-bold">ما هذه الأكاديمية؟</h2>

          <p className="text-base leading-8 text-muted-foreground text-pretty">
            أكاديمية الإمام البخاري مشروع تعليمي إلكتروني لإحياء الاهتمام بالسنة
            النبوية الشريفة، عبر منهجٍ علمي رصين يربط الحديث النبوي بمختلف
            العلوم الشرعية والحياتية والتقنيات الحديثة.
          </p>

          <p className="text-base leading-8 text-muted-foreground text-pretty">
            وتقوم على نظام المسارات التعليمية المتكاملة، متدرّجةً من الأساسيات
            إلى التخصص، تحت إشرافٍ علميٍّ موثوق من نخبةٍ من المشايخ المعاصرين،
            وتُقدَّم عبر منصةٍ إلكترونية متكاملة.
          </p>
        </div>

        <div className="rounded-2xl bg-muted/60 p-6">
          <h2 className="font-heading text-lg font-bold">
            الجيل الذي نسعى لتخريجه
          </h2>

          <ul className="mt-4 space-y-3">
            {ACADEMY_OUTCOMES.map((outcome) => (
              <li key={outcome} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3.5" />
                </span>
                <span className="text-sm leading-6">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MarketingSection>
  );
}
