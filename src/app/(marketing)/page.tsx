import {
  AboutSection,
  AudiencesSection,
  CtaSection,
  HeroSection,
  MethodologySection,
  PathsSection,
  ValuesSection,
} from "@/components/marketing";

/**
 * `/` — the landing page.
 *
 * A composition and nothing else. Every section is its own file under
 * `components/marketing/`, so this reads as the argument the page makes:
 *
 * 1. **Hero** — the vision, and one thing to do.
 * 2. **القيم** — why this academy rather than another. The positioning.
 * 3. **لمن** — whether the visitor is invited. Seven audiences, named.
 * 4. **المسارات** — what they would actually study.
 * 5. **المنهجية** — how a stage is built, in concrete terms.
 * 6. **عن الأكاديمية** — who stands behind it.
 * 7. **CTA** — sign up.
 *
 * The order answers the questions a visitor asks in the order they ask them,
 * and it moves from claim to evidence: the vision is a promise, and everything
 * under it is the reason to believe it. Trust before the ask — the sign-up band
 * is last because the case has to be made before the request.
 *
 * The whole page is **static**. Nothing here reads the request, the database or
 * the session; the one auth-dependent element, the header's sign-in button,
 * resolves on the client for exactly that reason — see
 * `marketing-auth-actions.tsx`.
 *
 * Every claim on it traces to `docs/business-analysis.md` through
 * `constants/marketing.ts`. See `docs/landing-page.md`.
 */
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ValuesSection />
      <AudiencesSection />
      <PathsSection />
      <MethodologySection />
      <AboutSection />
      <CtaSection />
    </>
  );
}
