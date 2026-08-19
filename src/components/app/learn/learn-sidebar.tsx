"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CurriculumTree } from "@/components/app/learn/curriculum-tree";
import { AccountMenu } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { PATH_CATEGORY_CLASSES, PATH_CATEGORY_LABELS } from "@/constants/path";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { LearnCurriculum } from "@/types/learn";
import { formatNumber } from "@/utils/format";

/**
 * The player's navigation: the curriculum itself.
 *
 * In the dashboard shell the sidebar lists the three places a learner can go.
 * Here it lists the path — every stage, its lessons, each lesson's exam and the
 * stage's final — because inside a path that *is* the navigation, and a
 * second copy of the app's nav beside it would only compete with it.
 *
 * Two deliberate differences from `AppSidebar`:
 *
 * - **`collapsible="offcanvas"`, not `"icon"`.** An icon rail works for three
 *   destinations with three icons; it cannot represent a forty-row curriculum
 *   at all. So the panel slides away whole, and the header's trigger brings it
 *   back.
 * - **Wider.** The width is raised on the provider in `(learn)/layout.tsx`:
 *   lesson titles are sentences, and at the dashboard's 16rem almost every row
 *   would truncate.
 *
 * `side="right"` is unchanged — that is the RTL start edge, and the player
 * should not move the navigation to the other side of the screen.
 */
export function LearnSidebar({ curriculum }: { curriculum: LearnCurriculum }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { path } = curriculum;

  // On mobile the sidebar is a drawer over the lesson — dismiss it on
  // navigation so the destination is actually visible.
  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar side="right" variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="gap-3 p-4">
        <Link
          href={ROUTES.app.paths}
          onClick={handleNavigate}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {/* Points right: in RTL that is the way back — `design-system.md`
              §10. Forward arrows in this app point left. */}
          <ArrowRight className="size-3.5" />
          مساراتي
        </Link>

        <div className="space-y-2">
          <Link
            href={ROUTES.path(path.id)}
            onClick={handleNavigate}
            className="block font-heading text-sm font-bold hover:underline"
          >
            {path.title}
          </Link>

          {path.category ? (
            <Badge
              className={cn(
                "border-transparent",
                PATH_CATEGORY_CLASSES[path.category],
              )}
            >
              {PATH_CATEGORY_LABELS[path.category]}
            </Badge>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {formatNumber(curriculum.completedLessonsCount)} من{" "}
              {formatNumber(curriculum.lessonsCount)} درس
            </span>
            <span className="font-medium tabular-nums">
              {formatNumber(curriculum.progress)}%
            </span>
          </div>
          <Progress value={curriculum.progress} />
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      {/* `SidebarContent` already scrolls, so a long curriculum scrolls inside
          the panel while the header above and the account menu below stay
          where the learner left them. */}
      <SidebarContent>
        <CurriculumTree curriculum={curriculum} onNavigate={handleNavigate} />
      </SidebarContent>

      <SidebarFooter>
        <AccountMenu signOutRedirect={ROUTES.home} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
