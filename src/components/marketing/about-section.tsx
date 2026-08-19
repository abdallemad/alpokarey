import { Check, ShieldCheck } from "lucide-react";

import { MarketingSection } from "@/components/marketing/marketing-section";
import { MARKETING_SUPERVISION_POINTS } from "@/constants/marketing";

/**
 * Who the academy is, and who stands behind what it teaches.
 *
 * Two things `business-analysis.md` treats as one: §1's description of the
 * project, and §5.2's scholarly supervision. They belong together because on a
 * page for an academy that has not launched, "what is this?" and "who vouches
 * for it?" are the same question — §9's SWOT lists supervision by known
 * contemporary scholars as the strength that grants **immediate credibility**,
 * and credibility is the only currency a pre-launch academy has.
 *
 * ### Why there are no scholars' names here
 *
 * §5.2 records an open gap: there is no contractual or scheduled arrangement
 * with the named scholars yet — permanent consultant, periodic session, content
 * review only, all still undecided. Printing their names on a public page would
 * claim an endorsement nobody has formalised, and that is an expensive claim to
 * withdraw. So the section states what the supervision *consists of*, which is
 * the declared model, and leaves the names to whoever is authorised to give
 * them. See `docs/landing-page.md` §5.
 *
 * A two-column split rather than another card grid: after three grids in a row
 * the page needs a change of shape more than it needs more cards.
 */
export function AboutSection() {
  return (
    <MarketingSection id="about">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-5">
          <p className="text-sm font-medium text-primary">عن الأكاديمية</p>

          <h2 className="font-heading text-3xl font-bold text-balance sm:text-4xl">
            أكاديميةٌ تُعيد للسنة موقعها من كل علم
          </h2>

          <p className="text-base leading-8 text-muted-foreground text-pretty">
            أكاديمية الإمام البخاري مشروع تعليمي إلكتروني لإحياء الاهتمام بالسنة
            النبوية عبر منهجٍ علمي رصين، يربط الحديث النبوي بالعلوم الشرعية
            والحياتية والتقنيات الحديثة.
          </p>

          <p className="text-base leading-8 text-muted-foreground text-pretty">
            وتقوم على نظام المسارات التعليمية المتكاملة، متدرّجةً من الأساسيات
            إلى التخصص، تحت إشرافٍ علميٍّ موثوق، وتُقدَّم عبر منصةٍ إلكترونية
            متكاملة.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <ShieldCheck className="size-5" />
            </span>

            <div>
              <h3 className="font-heading text-lg font-bold">
                إشرافٌ علميٌّ موثوق
              </h3>
              <p className="text-sm text-muted-foreground">
                لا يصل إلى الدارس إلا ما رُوجع وأُقرّ.
              </p>
            </div>
          </div>

          <ul className="space-y-2.5">
            {MARKETING_SUPERVISION_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="size-3.5" />
                </span>
                <span className="text-sm leading-6">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MarketingSection>
  );
}
