"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, Route, SearchX } from "lucide-react";

import { EnrolledPathCard } from "@/components/app/paths/enrolled-path-card";
import { MyPathsSkeleton } from "@/components/app/paths/my-paths-skeleton";
import { StudentStatCards } from "@/components/app/dashboard/student-stat-cards";
import {
  ApiErrorState,
  EmptyState,
  PageHeader,
  SearchInput,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PATH_CATEGORY_LABELS } from "@/constants/path";
import { ROUTES } from "@/constants/routes";
import {
  ENROLLED_PATHS_DEFAULT_QUERY,
  ENROLLED_PATH_SORT_LABELS,
  ENROLLED_PATH_STATE_LABELS,
} from "@/constants/student";
import { useMyPaths } from "@/hooks/use-my-paths";
import type { EnrolledPathsQueryState } from "@/types/student";
import { formatNumber } from "@/utils/format";
import { PATH_CATEGORIES } from "@/validation/path.schema";
import {
  ENROLLED_PATH_SORTS,
  ENROLLED_PATH_STATES,
} from "@/validation/student.schema";

const CATEGORY_ITEMS = {
  all: "كل التصنيفات",
  ...PATH_CATEGORY_LABELS,
};

/**
 * `/paths` — the paths this learner is enrolled in, and how far along each one
 * is.
 *
 * Filter state lives in the URL rather than component state, exactly as on
 * `/admin/paths`: refreshing keeps the view, the back button steps through
 * filters, and React Query caches each combination independently.
 */
export function MyPathsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query: EnrolledPathsQueryState = {
    search: searchParams.get("search") ?? ENROLLED_PATHS_DEFAULT_QUERY.search,
    category:
      searchParams.get("category") ?? ENROLLED_PATHS_DEFAULT_QUERY.category,
    state: searchParams.get("state") ?? ENROLLED_PATHS_DEFAULT_QUERY.state,
    sort: searchParams.get("sort") ?? ENROLLED_PATHS_DEFAULT_QUERY.sort,
  };

  const { data, isPending, isError, error, refetch } = useMyPaths(query);

  const setParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        // Defaults are stripped so the URL stays short and readable.
        if (value === null || value === "" || value === "all") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }

      router.replace(next.size > 0 ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const hasActiveFilters =
    query.search !== "" || query.category !== "all" || query.state !== "all";

  if (isPending) {
    return <MyPathsSkeleton />;
  }

  if (isError) {
    return (
      <ApiErrorState
        error={error}
        title="تعذّر تحميل مساراتك"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="مساراتي"
        description={
          data.totalEnrolled > 0
            ? `أنت مسجّل في ${formatNumber(data.totalEnrolled)} مسار. تابع تقدّمك في كل واحد منها.`
            : "ستظهر هنا المسارات التي تسجّل فيها، مع تقدّمك في كل مسار."
        }
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.app.dashboard} />}
          >
            <LayoutDashboard />
            لوحتي
          </Button>
        }
      />

      {/* The same four figures as the dashboard, from the same computation —
          a learner who lands here directly still gets the headline numbers,
          and they can never disagree with the ones on `/dashboard`. */}
      <StudentStatCards stats={data.stats} />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={query.search}
              onValueChange={(value) => setParams({ search: value })}
              placeholder="ابحث في مساراتك…"
              className="lg:max-w-xs"
            />

            <div className="flex flex-wrap items-center gap-2 lg:ms-auto">
              <Select
                items={ENROLLED_PATH_STATE_LABELS}
                value={query.state}
                onValueChange={(value) => setParams({ state: value as string })}
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENROLLED_PATH_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {ENROLLED_PATH_STATE_LABELS[state]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                items={CATEGORY_ITEMS}
                value={query.category}
                onValueChange={(value) =>
                  setParams({ category: value as string })
                }
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل التصنيفات</SelectItem>
                  {PATH_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {PATH_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                items={ENROLLED_PATH_SORT_LABELS}
                value={query.sort}
                onValueChange={(value) => setParams({ sort: value as string })}
              >
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENROLLED_PATH_SORTS.map((sort) => (
                    <SelectItem key={sort} value={sort}>
                      {ENROLLED_PATH_SORT_LABELS[sort]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {data.paths.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 px-4 xl:grid-cols-2">
              {data.paths.map((path) => (
                <EnrolledPathCard key={path.id} path={path} />
              ))}
            </div>
          ) : hasActiveFilters ? (
            // Two different nothings: no enrolments at all is the learner's
            // starting state, no matches is a filter they can undo.
            <EmptyState
              icon={SearchX}
              title="لا توجد مسارات مطابقة"
              description="جرّب تعديل كلمات البحث أو إزالة بعض عوامل التصفية."
              action={
                <Button
                  variant="outline"
                  onClick={() =>
                    setParams({ search: null, category: null, state: null })
                  }
                >
                  إزالة عوامل التصفية
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Route}
              title="لم تسجّل في أي مسار بعد"
              description="حين تسجّل في مسار سيظهر هنا مع مراحله ودروسه وتقدّمك فيه."
              action={
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={ROUTES.app.dashboard} />}
                >
                  <LayoutDashboard />
                  العودة إلى لوحتي
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
