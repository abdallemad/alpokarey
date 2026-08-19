"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";

/**
 * The footer's "حسابك" column, told apart by who is reading it.
 *
 * The same rule as the header: a signed-in visitor is not offered a sign-up
 * link, and an admin is pointed at the console rather than at a learner
 * dashboard. Leaving the footer listing all three while the header shows one
 * would have the same page giving two different answers about whether the
 * visitor has an account.
 *
 * Same reasoning as `marketing-auth-actions.tsx` for being a Client Component
 * and for treating `publicMetadata.role` as a convenience rather than a
 * permission — `/admin` guards itself.
 */
export function MarketingAccountLinks() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <ul className="mt-4 space-y-3" aria-hidden>
        {Array.from({ length: 2 }, (_, index) => (
          <li key={index}>
            <Skeleton className="h-4 w-24" />
          </li>
        ))}
      </ul>
    );
  }

  const links = isSignedIn
    ? user?.publicMetadata?.role === "ADMIN"
      ? [
          { href: ROUTES.admin.dashboard, label: "لوحة التحكم" },
          { href: ROUTES.app.home, label: "لوحتي" },
        ]
      : [
          { href: ROUTES.app.home, label: "لوحتي" },
          { href: ROUTES.app.certificates, label: "شهاداتي" },
        ]
    : [
        { href: ROUTES.signIn, label: "تسجيل الدخول" },
        { href: ROUTES.signUp, label: "إنشاء حساب" },
      ];

  return (
    <ul className="mt-4 space-y-3">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
