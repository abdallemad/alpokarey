import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";

import { MarketingSection } from "@/components/marketing/marketing-section";
import { Button } from "@/components/ui/button";
import { MARKETING_SUPERVISION_POINTS } from "@/constants/marketing";
import { ROUTES } from "@/constants/routes";

/**
 * Who vouches for what is taught — `business-analysis.md` §5.2.
 *
 * ### Why there are no scholars' names here
 *
 * §5.2 records an open gap: there is no contractual or scheduled arrangement
 * with the named scholars yet — permanent consultant, periodic session, content
 * review only, all still undecided. Printing their names on a public page would
 * claim an endorsement nobody has formalised, and that is an expensive claim to
 * withdraw. So this states what the supervision **consists of**, which is the
 * declared model, and leaves the names to whoever is authorised to give them.
 *
 * The same rule the landing page's `AboutSection` follows, for the same reason.
 *
 * It closes with a link to the methodology section rather than restating it:
 * "how is a stage built" is answered in detail on `/#methodology`, and copying
 * those six steps here would give the product two places to correct them.
 */
export function AboutSupervision() {
  return (
    <MarketingSection id="supervision">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-5">
          <span className="flex size-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <ShieldCheck className="size-6" />
          </span>

          <h2 className="font-heading text-3xl font-bold text-balance">
            لا يصل إلى الدارس إلا ما رُوجع وأُقرّ
          </h2>

          <p className="text-base leading-8 text-muted-foreground text-pretty">
            تتعاون الأكاديمية مع مشايخ معاصرين موثوقين لضمان أعلى مستويات
            الإشراف العلمي على ما يُنشر فيها، ولا يُفتح مسارٌ للدارسين قبل أن
            يمرّ بهذه المراجعة.
          </p>

          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`${ROUTES.home}#methodology`} />}
          >
            كيف تُبنى المرحلة الدراسية؟
            {/* Forward points left in RTL — design-system.md §10. */}
            <ArrowLeft />
          </Button>
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
    </MarketingSection>
  );
}
