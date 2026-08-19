import { SiteFooter, SiteHeader } from "@/components/marketing";

/**
 * The public site's shell — header, page, footer.
 *
 * A route group so the shell is declared once and every public page inherits
 * it. Before this, `app/page.tsx` imported `SiteHeader` and `SiteFooter`
 * itself, which meant the second marketing page would have had to remember to
 * do the same — the exact duplication `folder-structure.md` describes the
 * `(marketing)` group as existing to prevent.
 *
 * A **nested** layout, not a root one: `app/layout.tsx` above it still owns
 * `<html>`, `<body>`, the fonts and the providers. So navigating between
 * `(marketing)` and `(app)` is an ordinary client-side transition rather than
 * the full page load `route-groups.md` warns about for multiple root layouts.
 *
 * `flex-1` on `<main>` is what keeps the footer at the bottom of a short page
 * — the root `<body>` is already `flex min-h-full flex-col`.
 *
 * No `metadata` here: the root layout's title and description already describe
 * the academy, which is exactly what the landing page is about. A template
 * would only append the academy's name to its own name.
 */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
