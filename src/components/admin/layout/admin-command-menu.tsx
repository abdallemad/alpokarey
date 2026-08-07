"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ADMIN_NAV_GROUPS } from "@/constants/admin-navigation";

/** `⌘` on Apple platforms, `Ctrl` everywhere else. */
function useModifierLabel() {
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const isApple = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setLabel(isApple ? "⌘" : "Ctrl");
  }, []);

  return label;
}

/**
 * Keyboard-first navigation for the admin console (⌘K / Ctrl+K).
 *
 * Entries come from `ADMIN_NAV_GROUPS`, so the palette can never drift from the
 * sidebar. Ctrl+B is already taken by the sidebar toggle, hence K.
 */
export function AdminCommandMenu() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const modifier = useModifierLabel();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Desktop: a search-shaped affordance that advertises the shortcut. */}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="hidden w-56 justify-start gap-2 px-2 font-normal text-muted-foreground md:inline-flex"
      >
        <Search />
        <span className="flex-1 text-start">بحث في لوحة التحكم…</span>
        {modifier ? (
          <kbd className="pointer-events-none rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            {modifier} K
          </kbd>
        ) : null}
      </Button>

      {/* Mobile: the same action, collapsed to an icon. */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="بحث في لوحة التحكم"
        onClick={() => setOpen(true)}
        className="md:hidden"
      >
        <Search />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="بحث في لوحة التحكم"
        description="انتقل بسرعة إلى أي قسم داخل لوحة التحكم"
      >
        <CommandInput placeholder="اكتب للبحث…" />
        <CommandList>
          <CommandEmpty>لا توجد نتائج مطابقة.</CommandEmpty>
          {ADMIN_NAV_GROUPS.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={[item.label, ...(item.keywords ?? [])].join(" ")}
                  onSelect={() => go(item.href)}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
