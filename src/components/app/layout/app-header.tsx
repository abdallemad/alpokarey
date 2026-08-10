"use client";

import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/shared";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { APP_NAV_ITEMS, APP_SEGMENT_LABELS } from "@/constants/app-navigation";

/**
 * The sticky bar above every learner page: sidebar toggle, where-you-are, and
 * the theme switch.
 *
 * A Client Component, unlike the admin header, because the title is derived
 * from the pathname — layouts do not re-render on navigation, so a title passed
 * down from the layout would go stale on the first link click.
 *
 * Sticky rather than fixed, so it never overlaps the content beneath it.
 */
export function AppHeader() {
  const pathname = usePathname();

  const active = APP_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  // Unknown segments — a path id, a lesson id — fall back to the section they
  // sit under rather than dumping a raw UUID at the learner.
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  const title = active?.label ?? APP_SEGMENT_LABELS[segment] ?? "أكاديمية الإمام البخاري";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md md:px-4">
      <SidebarTrigger className="-ms-1 shrink-0" />
      <Separator
        orientation="vertical"
        className="data-vertical:h-4 data-vertical:self-center"
      />

      <h2 className="truncate text-sm font-medium">{title}</h2>

      <div className="ms-auto flex shrink-0 items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
