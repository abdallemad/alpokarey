import {
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/marketing/marketing-section";
import { MARKETING_VALUES } from "@/constants/marketing";

/**
 * The four core values — `business-analysis.md` §2.3.
 *
 * The same four the landing page shows, from the same constant, in a different
 * shape: there they are a scannable four-card row inside an argument; here they
 * are the section that carries the positioning, so each one gets a line of
 * reasoning beside it and the section says out loud what §2.3's own analytical
 * note concludes — that these values place the academy as a **bridge** between
 * the science of hadith and the modern disciplines, which is what separates it
 * from a memorisation platform.
 *
 * Restating them here is not duplication to remove. An about page that omits an
 * organisation's values because another page mentions them is an about page
 * that never says what the organisation is for.
 */
export function AboutValues() {
  return (
    <MarketingSection id="values">
      <MarketingSectionHeading
        eyebrow="قيمنا"
        title="أربع قيمٍ تحكم كل درسٍ نكتبه"
        description="ليست شعارات: كل واحدة منها قرارٌ في كيفية بناء المسار واختيار مادته."
      />

      <ol className="mx-auto mt-12 max-w-3xl divide-y divide-border overflow-hidden rounded-2xl ring-1 ring-foreground/10">
        {MARKETING_VALUES.map((value) => (
          <li
            key={value.title}
            className="flex items-start gap-4 bg-card p-5 sm:p-6"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <value.icon className="size-5" />
            </span>

            <div className="space-y-1.5">
              <h3 className="font-heading text-lg font-bold text-balance">
                {value.title}
              </h3>
              <p className="text-sm leading-7 text-muted-foreground text-pretty">
                {value.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-7 text-muted-foreground text-pretty">
        مجموعُ هذه القيم يضع الأكاديمية موضع الجسر بين علم الحديث والعلوم
        المعاصرة، لا موضع منصةٍ لحفظ المتون وحدها.
      </p>
    </MarketingSection>
  );
}
