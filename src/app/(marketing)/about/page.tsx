import type { Metadata } from "next";

import { CtaSection } from "@/components/marketing";
import {
  AboutIntro,
  AboutRoadmap,
  AboutSupervision,
  AboutTracks,
  AboutValues,
} from "@/components/marketing/about";

export const metadata: Metadata = {
  title: "عن الأكاديمية | أكاديمية الإمام البخاري",
  description:
    "أكاديمية الإمام البخاري: مشروع تعليمي إلكتروني لإحياء الاهتمام بالسنة النبوية عبر مسارات متدرّجة تربط الحديث بالعلوم الشرعية والحياتية، تحت إشراف علمي موثوق.",
};

/**
 * `/about` — the academy's own page.
 *
 * A composition, like `/`. Every section is its own file under
 * `components/marketing/about/`, so this reads as the case the page makes:
 *
 * 1. **من نحن** — the vision, the mission, and what the project is.
 * 2. **قيمنا** — the four values, with the positioning they carry.
 * 3. **نظام المسارات** — the model: graded tracks, and the two families of them.
 * 4. **الإشراف العلمي** — who vouches for what is taught.
 * 5. **خارطة الطريق** — where the project stands and what comes next.
 * 6. **CTA** — the same closing band as `/`.
 *
 * ### What it is *not*
 *
 * It deepens the landing page rather than repeating it. The audiences, the
 * curriculum-structure steps and the priority path list are all argued on `/`,
 * so this page names them and links rather than re-rendering their grids. What
 * is only here is the **model** (§4.1–4.3) and the **roadmap** (§6).
 *
 * ### Every claim is cited, and some are deliberately absent
 *
 * The copy lives in `constants/marketing.ts` under the rule that file is
 * maintained by: a sentence with no `business-analysis.md` citation is a
 * marketing claim nobody approved. Four things in that document are
 * deliberately **not** on this page — the SWOT, the technical gaps, the
 * undecided revenue model, and the scholars' names. The first three are the
 * working analysis behind the academy rather than public statements about it;
 * the fourth is an endorsement §5.2 records as not yet formalised. See
 * `docs/about-page.md` §4.
 *
 * The whole page is **static**: nothing here reads the request, the database or
 * the session.
 */
export default function AboutPage() {
  return (
    <>
      <AboutIntro />
      <AboutValues />
      <AboutTracks />
      <AboutSupervision />
      <AboutRoadmap />
      <CtaSection />
    </>
  );
}
