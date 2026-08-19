"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { MarketingAuthActions } from "@/components/marketing/marketing-auth-actions";
import { BrandLockup } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MARKETING_NAV_ITEMS } from "@/constants/marketing";

/**
 * The public site's navigation below `md` — the thing that was missing.
 *
 * Before this, the header hid its nav at `md` and its sign-in buttons at `sm`,
 * which left a phone visitor with a logo, a theme toggle, and **no way to
 * navigate or sign in at all**. On a landing page, whose entire job is to turn
 * a visitor into an account, that was the most expensive bug on the page.
 *
 * A `Sheet` from the **end** edge: in RTL `side="left"` is physical left, which
 * is where the trigger sits, so the panel comes out from under the button that
 * opened it rather than flying across the screen.
 *
 * Every link closes the drawer. These are in-page anchors — leaving the panel
 * open over the section it just scrolled to would hide the thing the visitor
 * asked for. `onOpenChange` is held here rather than relying on `SheetClose`
 * wrappers so the auth buttons, which navigate away, can close it too.
 */
export function MarketingMobileNav() {
  const [isOpen, setOpen] = React.useState(false);

  const close = () => setOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="فتح القائمة"
          />
        }
      >
        <Menu />
      </SheetTrigger>

      <SheetContent side="left" className="w-[86%] gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="text-start">
            <Link href="/" onClick={close} className="inline-flex">
              <BrandLockup subtitle="لخدمة السنة النبوية" />
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col p-2" aria-label="القائمة الرئيسية">
          {MARKETING_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-border p-4">
          <MarketingAuthActions layout="stacked" onNavigate={close} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
