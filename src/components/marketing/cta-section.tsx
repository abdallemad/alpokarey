import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ACADEMY_VISION } from "@/constants/marketing";
import { ROUTES } from "@/constants/routes";

/**
 * The closing call to action.
 *
 * ### What this section used to say, and why it changed
 *
 * It read **"انضم إلى آلاف الطلاب اليوم"** — join thousands of students.
 * `business-analysis.md` §1 records the project as being in **early founding**:
 * the vision, the values and the technical model are defined, and the curricula
 * are not written yet. There are no thousands of students. That was a false
 * factual claim on the most-read page of the product, and it is the sort of
 * claim a visitor can disprove in one click by looking at the empty catalog.
 *
 * What replaces it is not weaker, only true: the invitation is to be early. For
 * an academy whose credibility is its entire proposition — §9 lists scholarly
 * trust as its defining strength — a checkable overstatement in the closing
 * line costs more than it earns.
 *
 * The band is full-bleed `--primary`, the only place on the page that token
 * covers a whole surface, so the last thing a visitor scrolls past is
 * unmistakably the thing to click.
 */
export function CtaSection() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <h2 className="mx-auto max-w-2xl font-heading text-3xl font-bold text-balance sm:text-4xl">
          كن من أوائل الملتحقين بالأكاديمية
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-primary-foreground/85 text-pretty">
          أنشئ حسابك الآن لتتابع إطلاق المسارات أولًا بأول، وتبدأ رحلتك من أول
          مسارٍ يُفتح.
        </p>

        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            variant="secondary"
            className="h-12 px-7 text-base font-semibold"
            nativeButton={false}
            render={<Link href={ROUTES.signUp} />}
          >
            إنشاء حساب جديد
            {/* Forward points left in RTL — design-system.md §10. */}
            <ArrowLeft />
          </Button>

          <Button
            size="lg"
            variant="ghost"
            className="h-12 px-7 text-base text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
            nativeButton={false}
            render={<Link href={ROUTES.signIn} />}
          >
            لديّ حساب بالفعل
          </Button>
        </div>

        <p className="mt-10 font-heading text-lg font-bold text-primary-foreground/70">
          {ACADEMY_VISION}
        </p>
      </div>
    </section>
  );
}
