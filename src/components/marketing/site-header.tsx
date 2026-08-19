import Link from "next/link";

import { MarketingAuthActions } from "@/components/marketing/marketing-auth-actions";
import { MarketingMobileNav } from "@/components/marketing/marketing-mobile-nav";
import { BrandLockup, ThemeToggle } from "@/components/shared";
import { MARKETING_NAV_ITEMS } from "@/constants/marketing";

/**
 * The public site's header.
 *
 * A Server Component. Only the two pieces that must be interactive — the auth
 * buttons and the mobile drawer — cross into the client, so a visitor on a slow
 * connection gets the brand, the navigation and the links in the first paint.
 *
 * Two layouts from one markup, split at `md`:
 *
 * | | below `md` | `md` and up |
 * |---|---|---|
 * | Nav | in the drawer | a row in the header |
 * | Auth | in the drawer | beside the theme toggle |
 * | Trigger | hamburger | — |
 *
 * The breakpoint is `md` for both, deliberately. Before this, the nav hid at
 * `md` and the auth buttons at `sm`, which produced a window between the two
 * where a visitor had navigation but no way to sign in — and below `sm`,
 * neither. See `docs/landing-page.md` §4.
 *
 * The nav is centred with `flex-1` on both sides rather than by giving it
 * `justify-center` on a three-column grid, so a longer Arabic label cannot push
 * the brand off the start edge.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="أكاديمية الإمام البخاري">
          <BrandLockup subtitle="لخدمة السنة النبوية" />
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-1 md:flex"
          aria-label="القائمة الرئيسية"
        >
          {MARKETING_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-1 md:ms-0">
          <ThemeToggle />

          <div className="hidden md:block">
            <MarketingAuthActions />
          </div>

          <MarketingMobileNav />
        </div>
      </div>
    </header>
  );
}
