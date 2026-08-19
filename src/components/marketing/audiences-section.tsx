import {
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/marketing/marketing-section";
import { MARKETING_AUDIENCES } from "@/constants/marketing";

/**
 * Who the academy is for — `business-analysis.md` §3.1, all seven segments.
 *
 * The section the previous landing page was missing entirely, and the one that
 * changes who feels invited. §3 describes an audience running from a curious
 * Muslim with no background to an advanced researcher; a page that speaks only
 * to "students of knowledge" quietly turns away five of the seven groups the
 * project is built for — including children, women and non-Muslims, each of
 * which has its own planned curriculum.
 *
 * Rendered on `--muted` so it reads as a distinct band between the values above
 * and the paths below, rather than a third card grid in a row of card grids.
 */
export function AudiencesSection() {
  return (
    <MarketingSection id="audiences" className="bg-muted/50">
      <MarketingSectionHeading
        eyebrow="لمن الأكاديمية"
        title="مسارٌ لكل دارس، مهما كان مستواه"
        description="من أراد أن يعرف ما لا يسعه جهله، إلى الباحث المتخصص — لكلٍّ منهم طريقه هنا."
      />

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MARKETING_AUDIENCES.map((audience) => (
          <div
            key={audience.title}
            className="flex items-start gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <audience.icon className="size-5" />
            </span>

            <div className="min-w-0 space-y-1">
              <h3 className="font-heading text-base font-bold">
                {audience.title}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {audience.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </MarketingSection>
  );
}
