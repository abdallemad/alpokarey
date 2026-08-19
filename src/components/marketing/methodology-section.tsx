import {
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/marketing/marketing-section";
import { MARKETING_METHOD_STEPS } from "@/constants/marketing";
import { formatNumber } from "@/utils/format";

/**
 * How a stage is actually built — `business-analysis.md` §4.4.
 *
 * The most persuasive thing this page can say is not "we are excellent" but
 * "here is exactly what a stage contains", and §4.4 is unusually specific: a
 * stage runs 5–10 hours, split across lessons, each with transcripts,
 * mind-maps and exercises, closing with an exam and a certificate.
 *
 * It is also the section the product genuinely implements. §7 of the analysis
 * notes that `Path → Stage → Lesson → Quiz → Certificate` in the schema matches
 * this structure exactly — so unlike most landing-page methodology sections,
 * every item here corresponds to something that exists in the database.
 *
 * Numbered, because the numbering *is* the content: this is a sequence a
 * learner moves through, not six unrelated features. The counters go through
 * `formatNumber` so they render in the same Latin digits as every other number
 * in the product (`utils/format.ts`).
 */
export function MethodologySection() {
  return (
    <MarketingSection id="methodology" className="bg-muted/50">
      <MarketingSectionHeading
        eyebrow="منهجية الدراسة"
        title="كيف تسير المرحلة الواحدة؟"
        description="بناءٌ متدرّج محكوم بقواعد ثابتة، فلا يُترك الدارس ليجتهد في ترتيب طريقه بنفسه."
      />

      <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MARKETING_METHOD_STEPS.map((step, index) => (
          <li
            key={step.title}
            className="relative flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="size-5" />
              </span>

              <span className="font-heading text-2xl font-bold tabular-nums text-muted-foreground/40">
                {formatNumber(index + 1)}
              </span>
            </div>

            <h3 className="font-heading text-base font-bold text-balance">
              {step.title}
            </h3>

            <p className="text-sm leading-6 text-muted-foreground">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </MarketingSection>
  );
}
