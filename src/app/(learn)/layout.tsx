import type { Metadata } from "next";
import { cookies } from "next/headers";

import {
  SIDEBAR_COOKIE_NAME,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: {
    default: "التعلّم",
    template: "%s | أكاديمية الإمام البخاري",
  },
};

/**
 * The player's shell — a sibling of `(app)`, not a child of it.
 *
 * `/learn/…` used to render inside the dashboard shell, which meant the app's
 * three nav destinations sat beside the lesson and the curriculum had to fight
 * for what was left. It now has a route group of its own, so the sidebar can be
 * the curriculum: same primitive, same start edge, different contents. See
 * `docs/learn-layout.md`.
 *
 * Only the providers live here. The sidebar itself needs the path id and the
 * learner's progress in it, so it is mounted a segment lower, in
 * `learn/[pathId]/layout.tsx`.
 *
 * Two things are set on the provider:
 *
 * - **`--sidebar-width`** is raised from the dashboard's 16rem. Lesson titles
 *   are sentences rather than labels, and at the narrower width nearly every
 *   row in the curriculum would truncate.
 * - **`defaultOpen`** is read from the same `sidebar_state` cookie the
 *   dashboard writes, so the first paint already matches what the learner last
 *   chose instead of flashing an open panel that collapses a moment later. The
 *   two shells therefore share one "is the panel open" preference — a
 *   consequence of the shared cookie, and the behaviour a learner who collapsed
 *   the panel deliberately would expect.
 */
export default async function LearnRouteLayout({
  children,
}: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={{ "--sidebar-width": "21rem" } as React.CSSProperties}
      >
        {children}
      </SidebarProvider>
    </TooltipProvider>
  );
}
