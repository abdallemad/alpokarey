"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useUser } from "@clerk/nextjs";

import { AccountMenu, BrandLockup } from "@/components/shared";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_NAV_ITEMS } from "@/constants/app-navigation";
import { ROUTES } from "@/constants/routes";
import { isNavItemActive } from "@/utils/nav";

/**
 * The learner app's primary navigation.
 *
 * Structurally the same as the admin sidebar — `side="right"` for the RTL
 * start edge, an icon rail on desktop, a drawer below `md` — but with a flat
 * list instead of groups: three destinations do not need headings, and group
 * labels in an icon rail are noise.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { user } = useUser();

  // Clerk's public metadata is not the authority on roles — the local `User`
  // row is — so this link is a convenience for admins who are also learners,
  // not a permission. `/admin` guards itself.
  const isAdmin = user?.publicMetadata?.role === "ADMIN";

  // On mobile the sidebar is a drawer over the content — dismiss it on
  // navigation so the destination is actually visible.
  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar side="right" variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={ROUTES.app.home} />}
              onClick={handleNavigate}
            >
              <BrandLockup
                subtitle="منصّة التعلّم"
                textClassName="group-data-[collapsible=icon]:hidden"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {APP_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isNavItemActive(pathname, item)}
                    // `inline-end` puts the collapsed-rail tooltip on the
                    // content side in both RTL and LTR.
                    tooltip={{ children: item.label, side: "inline-end" }}
                    render={<Link href={item.href} />}
                    onClick={handleNavigate}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {isAdmin ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={{ children: "لوحة التحكم", side: "inline-end" }}
                render={<Link href={ROUTES.admin.dashboard} />}
                onClick={handleNavigate}
              >
                <ShieldCheck />
                <span>لوحة التحكم</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}

        <AccountMenu signOutRedirect={ROUTES.home} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
