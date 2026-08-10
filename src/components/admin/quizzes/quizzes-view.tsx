"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClipboardCheck, Plus, Route, SearchX } from "lucide-react";

import { QuizzesTable } from "@/components/admin/quizzes/quizzes-table";
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
import { PATH_STATUS_LABELS } from "@/constants/path";
import {
  QUIZZES_PAGE_SIZE,
  QUIZ_ACTIVE_LABELS,
  QUIZ_KIND_LABELS,
  QUIZ_SORT_LABELS,
} from "@/constants/quiz";
import { ROUTES } from "@/constants/routes";
import { usePathOptions } from "@/hooks/use-paths";
import { useQuizzes } from "@/hooks/use-quizzes";
import { useStageOptions } from "@/hooks/use-stages";
import type { QuizzesQueryState } from "@/types/quiz";
import { PATH_STATUSES } from "@/validation/path.schema";
import { QUIZ_KINDS, QUIZ_SORT_OPTIONS } from "@/validation/quiz.schema";

const KIND_ITEMS = { all: "كل الأنواع", ...QUIZ_KIND_LABELS };
const ACTIVE_ITEMS = { all: "الكل", ...QUIZ_ACTIVE_LABELS };
const STATUS_ITEMS = { all: "كل الحالات", ...PATH_STATUS_LABELS };
const SORT_ITEMS = QUIZ_SORT_LABELS;

/**
 * The `/admin/quizzes` screen.
 *
 * Same contract as the other list screens: filter state lives in the URL, so
 * refreshing keeps the view, the back button steps through filters, and a
 * filtered list can be pasted to a colleague.
 *
 * The filter that carries this screen is **النوع** — final exam of a stage,
 * exam of a lesson, or attached to neither. The third is the one worth
 * hunting for: an unlinked exam is invisible to students.
 */
export function QuizzesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query: QuizzesQueryState = {
    search: searchParams.get("search") ?? "",
    pathId: searchParams.get("pathId") ?? "all",
    stageId: searchParams.get("stageId") ?? "all",
    kind: searchParams.get("kind") ?? "all",
    active: searchParams.get("active") ?? "all",
    status: searchParams.get("status") ?? "all",
    sort: searchParams.get("sort") ?? "order",
    page: Number(searchParams.get("page")) || 1,
    pageSize: QUIZZES_PAGE_SIZE,
  };

  const { data, isPending, isFetching, isError, error, refetch } =
    useQuizzes(query);

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
      kind: null,
      active: null,
      status: null,
      page: null,
    });

  const hasActiveFilters =
    query.search !== "" ||
    query.pathId !== "all" ||
    query.stageId !== "all" ||
    query.kind !== "all" ||
    query.active !== "all" ||
    query.status !== "all";

  return (
    <>
      <PageHeader
        title="الاختبارات"
        description="اختبارات المراحل والدروس: نوع الاختبار، درجة النجاح، عدد الأسئلة، وحالة التفعيل."
        actions={
          <Button
            nativeButton={false}
            render={<Link href={`${ROUTES.admin.quizzes}/new`} />}
          >
            <Plus />
            اختبار جديد
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={query.search}
              onValueChange={(value) => setFilter("search", value)}
              placeholder="ابحث باسم الاختبار أو المرحلة أو المسار…"
              className="lg:max-w-xs"
            />

            <div className="flex flex-wrap items-center gap-2 lg:ms-auto">
              <Select
                items={KIND_ITEMS}
                value={query.kind}
                onValueChange={(value) => setFilter("kind", value as string)}
              >
                <SelectTrigger size="sm" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  {QUIZ_KINDS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {QUIZ_KIND_LABELS[kind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                <SelectTrigger size="sm" className="w-36">
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
                <SelectTrigger size="sm" className="w-36">
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
                items={ACTIVE_ITEMS}
                value={query.active}
                onValueChange={(value) => setFilter("active", value as string)}
              >
                <SelectTrigger size="sm" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="true">مفعّل</SelectItem>
                  <SelectItem value="false">غير مفعّل</SelectItem>
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
                  {QUIZ_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {QUIZ_SORT_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {isPending ? (
            <DataTableSkeleton columns={5} rows={QUIZZES_PAGE_SIZE} />
          ) : isError ? (
            <ApiErrorState
              error={error}
              title="تعذّر تحميل الاختبارات"
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
                icon={ClipboardCheck}
                title="لا توجد اختبارات بعد"
                description="أضف اختبارًا نهائيًا لمرحلة، أو اختبارًا مرتبطًا بدرس بعينه."
                action={
                  // An exam needs a stage, which needs a path — with neither,
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
                      render={<Link href={`${ROUTES.admin.quizzes}/new`} />}
                    >
                      <Plus />
                      إنشاء اختبار
                    </Button>
                  )
                }
              />
            )
          ) : (
            <>
              <QuizzesTable quizzes={data.items} />
              <DataPagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                isLoading={isFetching}
                itemLabel="اختبار"
                onPageChange={(page) => setParams({ page })}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
