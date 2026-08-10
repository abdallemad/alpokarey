import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AppHeader, AppSidebar } from "@/components/app/layout";
import {
  SIDEBAR_COOKIE_NAME,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: {
    default: "منصّة التعلّم",
    template: "%s | أكاديمية الإمام البخاري",
  },
};

/**
 * The learner shell: navigation on the RTL start edge, sticky header, page
 * content below it.
 *
 * Deliberately the same skeleton as the admin console — same sidebar
 * primitive, same cookie-backed open state, same `min-w-0` on the inset — so
 * the two halves of the product feel like one product, and a fix to the shell
 * benefits both.
 *
 * The sidebar's open/closed state is read from a cookie on the server so the
 * first paint already matches what the learner last chose, with no flash of an
 * open sidebar collapsing a moment later.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <AppHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
