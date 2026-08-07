import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AdminHeader, AdminSidebar } from "@/components/admin/layout";
import {
  SIDEBAR_COOKIE_NAME,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: {
    default: "لوحة التحكم",
    template: "%s | لوحة تحكم أكاديمية الإمام البخاري",
  },
  // The console is behind auth and has nothing to offer a crawler.
  robots: { index: false, follow: false },
};

/**
 * The admin console shell: navigation on the RTL start edge, sticky header,
 * page content below it.
 *
 * The sidebar's open/closed state is read from a cookie on the server so the
 * first paint already matches what the admin last chose — no flash of an open
 * sidebar collapsing a moment later.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AdminSidebar />
        {/* `min-w-0` lets wide tables scroll inside the content column
            instead of stretching the whole shell. */}
        <SidebarInset className="min-w-0">
          <AdminHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
