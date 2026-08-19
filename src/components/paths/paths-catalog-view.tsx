"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Compass, SearchX } from "lucide-react";

import { MarketingSectionHeading } from "@/components/marketing/marketing-section";
import { PathsCatalogSkeleton } from "@/components/paths/paths-catalog-skeleton";
import { PublicPathCard } from "@/components/paths/public-path-card";
import { ApiErrorState, DataPagination, EmptyState, SearchInput } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PATH_CATEGORY_LABELS,
  PUBLIC_PATHS_DEFAULT_QUERY,
  PUBLIC_PATH_CERTIFICATION_LABELS,
  PUBLIC_PATH_SORT_LABELS,
} from "@/constants/path";
import { ROUTES } from "@/constants/routes";
import { usePublicPaths } from "@/hooks/use-public-paths";
import type { PublicPathsQueryState } from "@/types/path";
import { formatNumber } from "@/utils/format";
import { PATH_CATEGORIES, PUBLIC_PATH_SORTS } from "@/validation/path.schema";

const CATEGORY_ITEMS = { all: "كل التصنيفات", ...PATH_CATEGORY_LABELS };

const CERTIFICATION_VALUES = ["all", "true", "false"] as const;

/**
 * `/paths` — every published path, searchable, filterable, paged.
 *
 * The landing page's section is a pitch that shows six; this is the index.
 * They read the **same endpoint** with different queries, so a path cannot
 * appear on one and be missing from the other.
 *
 * ### Filter state lives in the URL
 *
 * Exactly as on `/admin/paths` and `/dashboard/paths`: refreshing keeps the
 * view, the back button steps through filters, a filtered catalog can be
 * pasted to someone, and React Query caches each combination independently.
 * Defaults are stripped from the query string so the URL stays readable, and
 * changing any filter resets `page` — leaving a visitor on page 3 of a
 * two-page result is the classic way a filtered list appears empty.
 *
 * Because it reads `useSearchParams`, the page wraps it in `<Suspense>`.
 *
 * ### It is deliberately session-blind
 *
 * No enrolment badges, no "متابعة" buttons. The catalog answers "what does the
 * academy teach?", which is the same answer for everyone; "where am I in it?"
 * is `/dashboard/paths`, and "am I in this one?" is answered by the path page
 * one click away. Keeping the session out of it is also what lets one cached
 * response serve every visitor.
 */
export function PathsCatalogView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query: PublicPathsQueryState = {
    search: searchParams.get("search") ?? PUBLIC_PATHS_DEFAULT_QUERY.search,
    category:
      searchParams.get("category") ?? PUBLIC_PATHS_DEFAULT_QUERY.category,
    certification:
      searchParams.get("certification") ??
      PUBLIC_PATHS_DEFAULT_QUERY.certification,
    sort: searchParams.get("sort") ?? PUBLIC_PATHS_DEFAULT_QUERY.sort,
    page: Number(searchParams.get("page")) || PUBLIC_PATHS_DEFAULT_QUERY.page,
    pageSize: PUBLIC_PATHS_DEFAULT_QUERY.pageSize,
  };

  const { data, isPending, isError, error, isFetching, refetch } =
    usePublicPaths(query);

  const setParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        // Defaults are stripped so the URL stays short and readable.
        if (value === null || value === "" || value === "all" || value === "1") {
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

  /** Any filter change is a new result set, so it starts at page 1. */
  const setFilter = React.useCallback(
    (updates: Record<string, string | null>) =>
      setParams({ ...updates, page: null }),
    [setParams],
  );

  const hasActiveFilters =
    query.search !== "" ||
    query.category !== "all" ||
    query.certification !== "all";

  if (isPending) {
    return <PathsCatalogSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ApiErrorState
          error={error}
          title="تعذّر تحميل المسارات"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <MarketingSectionHeading
        eyebrow="المسارات"
        title="مسارات الأكاديمية"
        description="مسارات متدرّجة من الأساسيات إلى التخصص، كلٌّ منها مراحل ودروس واختبارات — ابحث فيها أو صفِّها حتى تجد ما يناسبك."
      />

      <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={query.search}
          onValueChange={(value) => setFilter({ search: value })}
          placeholder="ابحث عن مسار…"
          className="lg:max-w-xs"
        />

        <div className="flex flex-wrap items-center gap-2 lg:ms-auto">
          <Select
            items={CATEGORY_ITEMS}
            value={query.category}
            onValueChange={(value) => setFilter({ category: value as string })}
          >
            <SelectTrigger size="sm" className="w-40">
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
            items={PUBLIC_PATH_CERTIFICATION_LABELS}
            value={query.certification}
            onValueChange={(value) =>
              setFilter({ certification: value as string })
            }
          >
            <SelectTrigger size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CERTIFICATION_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {PUBLIC_PATH_CERTIFICATION_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={PUBLIC_PATH_SORT_LABELS}
            value={query.sort}
            onValueChange={(value) => setFilter({ sort: value as string })}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PUBLIC_PATH_SORTS.map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {PUBLIC_PATH_SORT_LABELS[sort]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {data.items.length > 0 ? (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {formatNumber(data.total)} مسار منشور
            {hasActiveFilters ? " مطابق لبحثك" : ""}
          </p>

          {/* `isFetching` dims the grid while the next page loads. The cards
              stay put rather than collapsing to skeletons — `keepPreviousData`
              in the hook — so the page filters instead of flickering. */}
          <div
            className="mt-4 grid grid-cols-1 gap-4 transition-opacity data-pending:opacity-60 md:grid-cols-2 lg:grid-cols-3"
            data-pending={isFetching ? "" : undefined}
          >
            {data.items.map((path) => (
              <PublicPathCard key={path.id} path={path} />
            ))}
          </div>

          <DataPagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="مسار"
            isLoading={isFetching}
            onPageChange={(page) => {
              setParams({ page: String(page) });
              // A new page of cards under the same filters — send the reader
              // back to the top of the grid rather than leaving them at the
              // pager they just clicked.
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      ) : hasActiveFilters ? (
        // Two different nothings: no match is a filter the visitor can undo,
        // an empty catalog is the academy's own state.
        <EmptyState
          icon={SearchX}
          title="لا توجد مسارات مطابقة"
          description="جرّب تعديل كلمات البحث أو إزالة بعض عوامل التصفية."
          action={
            <Button
              variant="outline"
              onClick={() =>
                setFilter({ search: null, category: null, certification: null })
              }
            >
              إزالة عوامل التصفية
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Compass}
          title="لم يُنشر أي مسار بعد"
          description="المناهج قيد الإعداد، ويُفتح كل مسار للتسجيل فور اكتمال مراحله. أنشئ حسابك الآن ليصلك أول مسار عند إطلاقه."
          action={
            <Button nativeButton={false} render={<Link href={ROUTES.signUp} />}>
              أنشئ حسابك
            </Button>
          }
        />
      )}
    </div>
  );
}
