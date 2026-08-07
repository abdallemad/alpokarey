"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";

import { BrandLockup } from "@/components/shared";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { ADMIN_NAV_GROUPS } from "@/constants/admin-navigation";
import { ROUTES } from "@/constants/routes";
import { isNavItemActive } from "@/utils/nav";
import { AdminUserMenu } from "./admin-user-menu";

/**
 * The admin console's primary navigation.
 *
 * `side="right"` is the RTL start edge, so the sidebar sits where an Arabic
 * reader expects it. On desktop it collapses to an icon rail (⌘/Ctrl+B); below
 * `md` the underlying component swaps itself for a Sheet drawer.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

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
              render={<Link href={ROUTES.admin.dashboard} />}
              onClick={handleNavigate}
            >
              <BrandLockup
                subtitle="لوحة التحكم"
                textClassName="group-data-[collapsible=icon]:hidden"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent>
        {ADMIN_NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
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
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={{ children: "العودة إلى الموقع", side: "inline-end" }}
              render={<Link href={ROUTES.home} />}
              onClick={handleNavigate}
            >
              <House />
              <span>العودة إلى الموقع</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <AdminUserMenu />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
