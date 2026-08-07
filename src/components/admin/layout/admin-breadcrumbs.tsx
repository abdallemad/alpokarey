"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ADMIN_FALLBACK_SEGMENT_LABEL,
  ADMIN_SEGMENT_LABELS,
} from "@/constants/admin-navigation";

type Crumb = { href: string; label: string };

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    // Unknown segments are almost always record IDs, which read as noise in a
    // trail — show a generic label instead of a raw UUID.
    label: ADMIN_SEGMENT_LABELS[segment] ?? ADMIN_FALLBACK_SEGMENT_LABEL,
  }));
}

/**
 * Location trail for the admin header.
 *
 * Derived from the pathname rather than passed down, because layouts do not
 * re-render on navigation and would serve a stale trail. Narrow screens show
 * only the current page; ancestors appear from `md` up.
 */
export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const crumbs = React.useMemo(() => buildCrumbs(pathname), [pathname]);

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem className={isLast ? "min-w-0" : "hidden md:inline-flex"}>
                {isLast ? (
                  <BreadcrumbPage className="truncate">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={crumb.href} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!isLast ? (
                <BreadcrumbSeparator className="hidden md:flex">
                  <ChevronLeft />
                </BreadcrumbSeparator>
              ) : null}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
