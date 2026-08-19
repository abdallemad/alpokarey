import {
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/marketing/marketing-section";
import { ACADEMY_ROADMAP } from "@/constants/marketing";
import { formatNumber } from "@/utils/format";

/**
 * Where the project is going — `business-analysis.md` §6.
 *
 * ### Why a pre-launch academy publishes its roadmap
 *
 * §1 records the project in **early founding**, and §9's SWOT names scholarly
 * credibility as its defining strength. An academy in that position cannot
 * claim a catalog it does not have, but it can say exactly what it is doing and
 * in what order — and a visitor who can see the plan is being told the truth
 * about where things stand. That is worth more than a page implying everything
 * is ready.
 *
 * ### What is deliberately absent
 *
 * **Dates.** §6 gives an order, not a schedule. Inventing "Q3" here would be a
 * promise nobody has made, and a missed public date costs more than a vague
 * one saves.
 *
 * **The analysis.** §6 carries an internal note weighing infrastructure-first
 * against a pilot track, and §§7–11 hold the technical gaps, the SWOT and the
 * undecided revenue model. None of that is a public statement about the
 * academy; it is the working analysis behind it, and it stays in the document.
 *
 * Numbered rather than iconised alone: a roadmap's meaning is its order, and
 * the numeral says "then" in a way four icons in a row cannot.
 */
export function AboutRoadmap() {
  return (
    <MarketingSection id="roadmap" className="bg-muted/40">
      <MarketingSectionHeading
        eyebrow="خارطة الطريق"
        title="أين نحن، وإلى أين نمضي"
        description="المشروع في مرحلة التأسيس، وهذه المراحل الأربع هي ترتيب العمل كما هو مُقرّر — بلا وعودٍ بمواعيد."
      />

      <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ACADEMY_ROADMAP.map((phase, index) => (
          <li
            key={phase.title}
            className="relative flex h-full flex-col gap-3 rounded-xl bg-background p-5 ring-1 ring-foreground/10"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-base font-bold text-primary tabular-nums">
                {formatNumber(index + 1)}
              </span>
              <phase.icon className="size-4 text-muted-foreground" />
            </div>

            <h3 className="font-heading text-base font-bold text-balance">
              {phase.title}
            </h3>

            <p className="text-sm leading-6 text-muted-foreground text-pretty">
              {phase.description}
            </p>
          </li>
        ))}
      </ol>
    </MarketingSection>
  );
}
