"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Route, SearchX } from "lucide-react";

import { PathsTable } from "@/components/admin/paths/paths-table";
import {
  ApiErrorState,
  DataPagination,
  DataTableSkeleton,
  EmptyState,
  PageHeader,
  SearchInput,
} from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PATHS_PAGE_SIZE,
  PATH_CATEGORY_LABELS,
  PATH_SORT_LABELS,
  PATH_STATUS_LABELS,
} from "@/constants/path";
import { ROUTES } from "@/constants/routes";
import { usePaths } from "@/hooks/use-paths";
import type { PathsQueryState } from "@/types/path";
import {
  PATH_CATEGORIES,
  PATH_SORT_OPTIONS,
  PATH_STATUSES,
} from "@/validation/path.schema";

const STATUS_ITEMS = {
  all: "كل الحالات",
  ...PATH_STATUS_LABELS,
};

const CATEGORY_ITEMS = {
  all: "كل التصنيفات",
  ...PATH_CATEGORY_LABELS,
};

const FEATURED_ITEMS = {
  all: "الكل",
  true: "المميزة فقط",
  false: "غير المميزة",
};

const SORT_ITEMS = PATH_SORT_LABELS;

/**
 * The `/admin/paths` screen.
 *
 * Filter state lives in the URL rather than component state: refreshing keeps
 * the view, the back button steps through filters, and a filtered list can be
 * pasted to a colleague. React Query keys off that same state, so each distinct
 * filter combination is cached independently.
 */
export function PathsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query: PathsQueryState = {
    search: searchParams.get("search") ?? "",
    status: searchParams.get("status") ?? "all",
    category: searchParams.get("category") ?? "all",
    featured: searchParams.get("featured") ?? "all",
    sort: searchParams.get("sort") ?? "newest",
    page: Number(searchParams.get("page")) || 1,
    pageSize: PATHS_PAGE_SIZE,
  };

  const { data, isPending, isFetching, isError, error, refetch } =
    usePaths(query);

  const setParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const next = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        // Defaults are omitted so the URL stays short and readable.
        if (value === null || value === "" || value === "all") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      router.replace(`${pathname}?${next}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  /** Any filter change invalidates the current page number. */
  const setFilter = (key: string, value: string) =>
    setParams({ [key]: value, page: null });

  const hasActiveFilters =
    query.search !== "" ||
    query.status !== "all" ||
    query.category !== "all" ||
    query.featured !== "all";

  return (
    <>
      <PageHeader
        title="المسارات"
        description="إدارة المسارات التعليمية: العنوان، التصنيف، حالة النشر، وتفعيل الشهادات."
        actions={
          // `nativeButton={false}` tells Base UI the rendered element is an
          // <a>, not a <button>, so it applies link semantics instead of
          // native button behaviour.
          <Button
            nativeButton={false}
            render={<Link href={`${ROUTES.admin.paths}/new`} />}
          >
            <Plus />
            مسار جديد
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={query.search}
              onValueChange={(value) => setFilter("search", value)}
              placeholder="ابحث بعنوان المسار أو وصفه…"
              className="lg:max-w-xs"
            />

            <div className="flex flex-wrap items-center gap-2 lg:ms-auto">
              <Select
                items={STATUS_ITEMS}
                value={query.status}
                onValueChange={(value) => setFilter("status", value as string)}
              >
                <SelectTrigger size="sm" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {PATH_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {PATH_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                items={CATEGORY_ITEMS}
                value={query.category}
                onValueChange={(value) =>
                  setFilter("category", value as string)
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
                items={FEATURED_ITEMS}
                value={query.featured}
                onValueChange={(value) =>
                  setFilter("featured", value as string)
                }
              >
                <SelectTrigger size="sm" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="true">المميزة فقط</SelectItem>
                  <SelectItem value="false">غير المميزة</SelectItem>
                </SelectContent>
              </Select>

              <Select
                items={SORT_ITEMS}
                value={query.sort}
                onValueChange={(value) => setFilter("sort", value as string)}
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATH_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {PATH_SORT_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {isPending ? (
            <DataTableSkeleton columns={4} rows={PATHS_PAGE_SIZE} />
          ) : isError ? (
            <ApiErrorState
              error={error}
              title="تعذّر تحميل المسارات"
              onRetry={() => refetch()}
            />
          ) : data.items.length === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                icon={SearchX}
                title="لا توجد نتائج مطابقة"
                description="جرّب تعديل كلمات البحث أو إزالة بعض عوامل التصفية."
                action={
                  <Button
                    variant="outline"
                    onClick={() =>
                      setParams({
                        search: null,
                        status: null,
                        category: null,
                        featured: null,
                        page: null,
                      })
                    }
                  >
                    إزالة عوامل التصفية
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Route}
                title="لا توجد مسارات بعد"
                description="ابدأ بإنشاء أول مسار تعليمي، ثم أضف إليه المراحل والدروس."
                action={
                  <Button
                    nativeButton={false}
                    render={<Link href={`${ROUTES.admin.paths}/new`} />}
                  >
                    <Plus />
                    إنشاء مسار
                  </Button>
                }
              />
            )
          ) : (
            <>
              <PathsTable paths={data.items} />
              <DataPagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                isLoading={isFetching}
                itemLabel="مسار"
                onPageChange={(page) => setParams({ page })}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
