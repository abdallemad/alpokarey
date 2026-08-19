"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { LayoutDashboard, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

/**
 * What the header offers, depending on who is looking.
 *
 * | Visitor | Sees |
 * |---|---|
 * | Signed out | "تسجيل الدخول" + "ابدأ الآن" |
 * | Signed-in learner | "لوحتي" → `/dashboard/home` |
 * | Signed-in admin | "لوحة التحكم" → `/admin` |
 *
 * A returning learner should not be asked to sign in again — they should be one
 * click from where they left off — and an admin arriving at the marketing home
 * almost always wants the console, not a learner dashboard where every figure
 * is their own empty progress.
 *
 * ### The role check is a convenience, not a permission
 *
 * `publicMetadata.role` is Clerk's copy. The **local `User.role` row is the
 * authority**, and `/admin` guards itself server-side regardless of what this
 * button says — exactly the reasoning already recorded in `app-sidebar.tsx`.
 * A tampered metadata claim buys nothing here: it changes which link is
 * rendered, and the destination refuses on its own.
 *
 * An admin is also a learner, so nothing is taken away — `/dashboard/home` is
 * still one click further, from the account menu inside the console.
 *
 * ### Why this is a Client Component
 *
 * Clerk v7 ships a server-side `<Show when="signed-in">` that would avoid the
 * client round trip. Using it would make the whole marketing layout **dynamic**,
 * and a landing page is the one route in this product that genuinely benefits
 * from being static. So the cost is paid on the client, where it is one small
 * component rather than the page — `/` still builds as `○ (Static)`.
 *
 * Until Clerk has loaded, this renders skeletons **the same size** as the
 * buttons they stand in for — the trick `ThemeToggle` already uses, for the
 * same two reasons: the server HTML and the first client render stay identical
 * (no hydration mismatch), and the header does not reflow when the answer
 * arrives.
 */
export function MarketingAuthActions({
  /** `"stacked"` fills the width — how the mobile drawer wants them. */
  layout = "inline",
  onNavigate,
}: {
  layout?: "inline" | "stacked";
  onNavigate?: () => void;
}) {
  const { isLoaded, isSignedIn, user } = useUser();

  const isStacked = layout === "stacked";
  const containerClass = cn(
    "flex gap-2",
    isStacked ? "flex-col" : "items-center",
  );
  const buttonClass = isStacked ? "w-full" : undefined;

  if (!isLoaded) {
    return (
      <div className={containerClass} aria-hidden>
        <Skeleton className={cn("h-8 w-24 rounded-lg", buttonClass)} />
        <Skeleton className={cn("h-8 w-20 rounded-lg", buttonClass)} />
      </div>
    );
  }

  if (isSignedIn) {
    const isAdmin = user?.publicMetadata?.role === "ADMIN";

    return (
      <div className={containerClass}>
        <Button
          className={buttonClass}
          nativeButton={false}
          onClick={onNavigate}
          render={
            <Link
              href={isAdmin ? ROUTES.admin.dashboard : ROUTES.app.home}
            />
          }
        >
          {isAdmin ? <ShieldCheck /> : <LayoutDashboard />}
          {isAdmin ? "لوحة التحكم" : "لوحتي"}
        </Button>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <Button
        variant="ghost"
        className={buttonClass}
        nativeButton={false}
        onClick={onNavigate}
        render={<Link href={ROUTES.signIn} />}
      >
        تسجيل الدخول
      </Button>
      <Button
        className={buttonClass}
        nativeButton={false}
        onClick={onNavigate}
        render={<Link href={ROUTES.signUp} />}
      >
        ابدأ الآن
      </Button>
    </div>
  );
}
