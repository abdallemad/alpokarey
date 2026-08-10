"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Plus, Route, SearchX } from "lucide-react";

import { LessonsTable } from "@/components/admin/lessons/lessons-table";
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
  LESSONS_PAGE_SIZE,
  LESSON_SORT_LABELS,
  LESSON_TYPE_LABELS,
} from "@/constants/lesson";
import { PATH_STATUS_LABELS } from "@/constants/path";
import { ROUTES } from "@/constants/routes";
import { useLessons } from "@/hooks/use-lessons";
import { usePathOptions } from "@/hooks/use-paths";
import { useStageOptions } from "@/hooks/use-stages";
import type { LessonsQueryState } from "@/types/lesson";
import {
  LESSON_SORT_OPTIONS,
  LESSON_TYPES,
} from "@/validation/lesson.schema";
import { PATH_STATUSES } from "@/validation/path.schema";

const TYPE_ITEMS = { all: "كل الأنواع", ...LESSON_TYPE_LABELS };
const STATUS_ITEMS = { all: "كل الحالات", ...PATH_STATUS_LABELS };
const SORT_ITEMS = LESSON_SORT_LABELS;

/**
 * The `/admin/lessons` screen.
 *
 * Same contract as the other list screens: filter state lives in the URL
 * rather than component state, so refreshing keeps the view, the back button
 * steps through filters, and a filtered list can be pasted to a colleague.
 *
 * The path and stage filters are a cascade — a stage only means something
 * inside its path, and every stage in the academy would be an unusable list —
 * so the stage select stays disabled until a path is chosen, and changing the
 * path clears it.
 */
export function LessonsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query: LessonsQueryState = {
    search: searchParams.get("search") ?? "",
    pathId: searchParams.get("pathId") ?? "all",
    stageId: searchParams.get("stageId") ?? "all",
    type: searchParams.get("type") ?? "all",
    status: searchParams.get("status") ?? "all",
    sort: searchParams.get("sort") ?? "order",
    page: Number(searchParams.get("page")) || 1,
    pageSize: LESSONS_PAGE_SIZE,
  };

  const { data, isPending, isFetching, isError, error, refetch } =
    useLessons(query);

  const { data: pathOptions, isPending: isLoadingPaths } = usePathOptions();
  const { data: stageOptions, isFetching: isLoadingStages } = useStageOptions(
    query.pathId,
  );

  const pathItems = React.useMemo<Record<string, string>>(
    () => ({
      all: "كل المسارات",
      ...Object.fromEntries(
        (pathOptions ?? []).map((path) => [path.id, path.title]),
      ),
    }),
    [pathOptions],
  );

  const stageItems = React.useMemo<Record<string, string>>(
    () => ({
      all: "كل المراحل",
      ...Object.fromEntries(
        (stageOptions ?? []).map((stage) => [stage.id, stage.title]),
      ),
    }),
    [stageOptions],
  );

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

  const clearFilters = () =>
    setParams({
      search: null,
      pathId: null,
      stageId: null,
      type: null,
      status: null,
      page: null,
    });

  const hasActiveFilters =
    query.search !== "" ||
    query.pathId !== "all" ||
    query.stageId !== "all" ||
    query.type !== "all" ||
    query.status !== "all";

  return (
    <>
      <PageHeader
        title="الدروس"
        description="دروس كل مرحلة: النوع، المدة، الترتيب، والمرفقات."
        actions={
          <Button
            nativeButton={false}
            render={<Link href={`${ROUTES.admin.lessons}/new`} />}
          >
            <Plus />
            درس جديد
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={query.search}
              onValueChange={(value) => setFilter("search", value)}
              placeholder="ابحث باسم الدرس أو المرحلة أو المسار…"
              className="lg:max-w-xs"
            />

            <div className="flex flex-wrap items-center gap-2 lg:ms-auto">
              <Select
                items={pathItems}
                value={query.pathId}
                disabled={isLoadingPaths}
                onValueChange={(value) =>
                  // A stage belongs to one path, so a stage filter from the
                  // previous path would contradict the new one.
                  setParams({
                    pathId: value as string,
                    stageId: null,
                    page: null,
                  })
                }
              >
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue>
                    {(value: string) => pathItems[value] ?? "مسار محدد"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المسارات</SelectItem>
                  {(pathOptions ?? []).map((path) => (
                    <SelectItem key={path.id} value={path.id}>
                      {path.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                items={stageItems}
                value={query.stageId}
                disabled={query.pathId === "all" || isLoadingStages}
                onValueChange={(value) => setFilter("stageId", value as string)}
              >
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue>
                    {(value: string) =>
                      query.pathId === "all"
                        ? "اختر مسارًا أولًا"
                        : (stageItems[value] ?? "مرحلة محددة")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المراحل</SelectItem>
                  {(stageOptions ?? []).map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.order}. {stage.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                items={TYPE_ITEMS}
                value={query.type}
                onValueChange={(value) => setFilter("type", value as string)}
              >
                <SelectTrigger size="sm" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  {LESSON_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {LESSON_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                items={SORT_ITEMS}
                value={query.sort}
                onValueChange={(value) => setFilter("sort", value as string)}
              >
                <SelectTrigger size="sm" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {LESSON_SORT_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {isPending ? (
            <DataTableSkeleton columns={4} rows={LESSONS_PAGE_SIZE} />
          ) : isError ? (
            <ApiErrorState
              error={error}
              title="تعذّر تحميل الدروس"
              onRetry={() => refetch()}
            />
          ) : data.items.length === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                icon={SearchX}
                title="لا توجد نتائج مطابقة"
                description="جرّب تعديل كلمات البحث أو إزالة بعض عوامل التصفية."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    إزالة عوامل التصفية
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={BookOpen}
                title="لا توجد دروس بعد"
                description="ابدأ بإضافة أول درس إلى إحدى المراحل، ثم أرفق به التفريغات والملخصات."
                action={
                  // A lesson needs a stage, which needs a path — with neither,
                  // the only useful action is to go and build them.
                  (pathOptions?.length ?? 0) === 0 ? (
                    <Button
                      variant="outline"
                      nativeButton={false}
                      render={<Link href={ROUTES.admin.paths} />}
                    >
                      <Route />
                      الذهاب إلى المسارات
                    </Button>
                  ) : (
                    <Button
                      nativeButton={false}
                      render={<Link href={`${ROUTES.admin.lessons}/new`} />}
                    >
                      <Plus />
                      إنشاء درس
                    </Button>
                  )
                }
              />
            )
          ) : (
            <>
              <LessonsTable lessons={data.items} />
              <DataPagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                isLoading={isFetching}
                itemLabel="درس"
                onPageChange={(page) => setParams({ page })}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
