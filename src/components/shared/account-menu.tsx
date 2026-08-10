"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/constants/routes";

/** First letter of the display name, or of the email as a last resort. */
function getInitial(name: string | null | undefined, email: string | undefined) {
  return (name?.trim() || email || "؟").charAt(0).toUpperCase();
}

/**
 * The signed-in person's account control, pinned to a sidebar footer.
 *
 * Domain-neutral: the admin console and the learner app mount the same
 * component, because "who am I and how do I sign out" is the same question in
 * both. It renders three states — a skeleton while Clerk boots, a sign-in
 * prompt when there is no session, and the menu once a user is available.
 */
export function AccountMenu({
  /** Where signing out lands. */
  signOutRedirect = ROUTES.home,
}: {
  signOutRedirect?: string;
} = {}) {
  const { isMobile } = useSidebar();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  if (!isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex h-12 items-center gap-2 rounded-md p-2">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="grid flex-1 gap-1.5 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!isSignedIn) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={{ children: "تسجيل الدخول", side: "inline-end" }}
            render={<Link href="/sign-in" />}
          >
            <UserRound />
            <span>تسجيل الدخول</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress;
  const displayName = user.fullName ?? email ?? "مستخدم";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={{ children: displayName, side: "inline-end" }}
              />
            }
          >
            <Avatar>
              <AvatarImage src={user.imageUrl} alt={displayName} />
              <AvatarFallback>{getInitial(user.fullName, email)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-medium">{displayName}</span>
              {email ? (
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              ) : null}
            </div>
            <ChevronsUpDown className="ms-auto group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            // Open toward the content area on desktop; upward on mobile, where
            // the trigger sits at the bottom of the drawer.
            side={isMobile ? "top" : "inline-end"}
            align="end"
            className="min-w-56"
          >
            <div className="flex items-center gap-2 px-1.5 py-1.5">
              <Avatar>
                <AvatarImage src={user.imageUrl} alt={displayName} />
                <AvatarFallback>
                  {getInitial(user.fullName, email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start leading-tight">
                <span className="truncate text-sm font-medium">
                  {displayName}
                </span>
                {email ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                ) : null}
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => openUserProfile()}>
              <UserRound />
              <span>الملف الشخصي</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ redirectUrl: signOutRedirect })}
            >
              <LogOut />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
