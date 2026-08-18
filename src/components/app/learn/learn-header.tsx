"use client";

import { PathCertificateButton } from "@/components/app/learn/path-certificate-button";
import { ThemeToggle } from "@/components/shared";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { LearnCurriculum } from "@/types/learn";

/**
 * The player's sticky bar — the same bar as the dashboard's, with one addition.
 *
 * Deliberately the same skeleton as `AppHeader`: the same height, the same
 * sidebar trigger on the start edge, the same vertical rule, the same
 * truncating title, the same theme toggle at the end. A learner moving from
 * their dashboard into a lesson should not feel they have left the product, and
 * the trigger in particular has to stay exactly where their hand expects it —
 * it is the only way back to the curriculum once the panel is closed.
 *
 * The title is the **path**, not the open lesson. The lesson names itself at
 * the top of the content column and again in the sidebar; the one thing the
 * chrome can add is which course all of this belongs to.
 *
 * The addition is the certificate button. It lives here rather than at the foot
 * of the last lesson because the reward for finishing a path should not be
 * something a learner has to go and find — see `docs/certificates-feature.md`.
 */
export function LearnHeader({ curriculum }: { curriculum: LearnCurriculum }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md md:px-4">
      <SidebarTrigger className="-ms-1 shrink-0" />
      <Separator
        orientation="vertical"
        className="data-vertical:h-4 data-vertical:self-center"
      />

      <h2 className="truncate text-sm font-medium">{curriculum.path.title}</h2>

      <div className="ms-auto flex shrink-0 items-center gap-1">
        <PathCertificateButton curriculum={curriculum} />
        <ThemeToggle />
      </div>
    </header>
  );
}
