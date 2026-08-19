import {
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/marketing/marketing-section";
import { Card, CardContent } from "@/components/ui/card";
import { MARKETING_VALUES } from "@/constants/marketing";

/**
 * The four core values — `business-analysis.md` §2.3.
 *
 * This is the positioning section, and it comes first after the hero for that
 * reason. §2.3's own note observes that these values place the academy as a
 * **bridge** between the science of hadith and modern disciplines, which is
 * what separates it from a hadith-memorisation platform. A visitor deciding
 * whether this is a serious project reads this before they read a course list.
 *
 * Four columns at `lg`, two at `sm`, one below. Not three: there are four
 * values, and a 3-grid would orphan the fourth on its own row.
 */
export function ValuesSection() {
  return (
    <MarketingSection id="values">
      <MarketingSectionHeading
        eyebrow="قيمنا"
        title="ما الذي يميّز هذه الأكاديمية؟"
        description="أربع قيم تحكم كل مسار ندرّسه، وكل درس نكتبه."
      />

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MARKETING_VALUES.map((value) => (
          <Card key={value.title} className="h-full">
            <CardContent className="space-y-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <value.icon className="size-5" />
              </div>

              <h3 className="font-heading text-lg font-bold text-balance">
                {value.title}
              </h3>

              <p className="text-sm leading-6 text-muted-foreground">
                {value.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </MarketingSection>
  );
}
