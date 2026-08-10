"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Layers, Plus, Route, SearchX } from "lucide-react";

import { StageFormDialog } from "@/components/admin/stages/stage-form-dialog";
import { StagesTable } from "@/components/admin/stages/stages-table";
import {
  ApiErrorState,
  DataPagination,
  DataTableSkeleton,
  DeleteConfirmationDialog,
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
import { PATH_CATEGORY_LABELS, PATH_STATUS_LABELS } from "@/constants/path";
import { ROUTES } from "@/constants/routes";
import {
  STAGES_PAGE_SIZE,
  STAGE_CONTENT_LABELS,
  STAGE_SORT_LABELS,
} from "@/constants/stage";
import { usePathOptions } from "@/hooks/use-paths";
import { useDeleteStage } from "@/hooks/use-stage";
import { useStages } from "@/hooks/use-stages";
import type { StageListItem, StagesQueryState } from "@/types/stage";
import { formatNumber } from "@/utils/format";
import { PATH_CATEGORIES, PATH_STATUSES } from "@/validation/path.schema";
import {
  STAGE_CONTENT_FILTERS,
  STAGE_SORT_OPTIONS,
} from "@/validation/stage.schema";

const STATUS_ITEMS = { all: "كل الحالات", ...PATH_STATUS_LABELS };
const CATEGORY_ITEMS = { all: "كل التصنيفات", ...PATH_CATEGORY_LABELS };
const CONTENT_ITEMS = STAGE_CONTENT_LABELS;
const SORT_ITEMS = STAGE_SORT_LABELS;

/**
 * The `/admin/stages` screen.
 *
 * Same contract as `/admin/paths`: filter state lives in the URL rather than
 * component state, so refreshing keeps the view, the back button steps through
 * filters, and a filtered list can be pasted to a colleague. React Query keys
 * off that same state, so each filter combination is cached independently.
 *
 * Two things differ. The status and category filters act on the **parent
 * path**, since a stage has neither of its own. And the payload arrives already
 * grouped: the server pages over paths rather than stages so that a path's
 * stages are never split across a page boundary, which means `data.items` is a
 * list of groups and `data.total` counts paths — see
 * `stageRepository.findGroupedPage`.
 */
export function StagesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query: StagesQueryState = {
    search: searchParams.get("search") ?? "",
    pathId: searchParams.get("pathId") ?? "all",
    status: searchParams.get("status") ?? "all",
    category: searchParams.get("category") ?? "all",
    content: searchParams.get("content") ?? "all",
    sort: searchParams.get("sort") ?? "order",
    page: Number(searchParams.get("page")) || 1,
    pageSize: STAGES_PAGE_SIZE,
  };

  const { data, isPending, isFetching, isError, error, refetch } =
    useStages(query);

  const { data: pathOptions, isPending: isLoadingPaths } = usePathOptions();
  const deleteStage = useDeleteStage();

  /**
   * The form dialog's target is kept after it closes, so the exit animation
   * does not flash the "create" copy over a stage the admin was editing.
   */
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formTarget, setFormTarget] = React.useState<{
    stage?: StageListItem;
    pathId?: string;
  }>({});
  const [pendingDelete, setPendingDelete] =
    React.useState<StageListItem | null>(null);

  const openCreate = (pathId?: string) => {
    setFormTarget({ pathId });
    setIsFormOpen(true);
  };

  const openEdit = (stage: StageListItem) => {
    setFormTarget({ stage });
    setIsFormOpen(true);
  };

  // `items` lets `<SelectValue>` render the chosen path's title before the
  // popup has ever been opened.
  const pathItems = React.useMemo<Record<string, string>>(
    () => ({
      all: "كل المسارات",
      ...Object.fromEntries(
        (pathOptions ?? []).map((path) => [path.id, path.title]),
      ),
    }),
    [pathOptions],
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
      status: null,
      category: null,
      content: null,
      page: null,
    });

  const hasActiveFilters =
    query.search !== "" ||
    query.pathId !== "all" ||
    query.status !== "all" ||
    query.category !== "all" ||
    query.content !== "all";

  return (
    <>
      <PageHeader
        title="المراحل"
        description="مراحل كل مسار وترتيبها، مع مراعاة المدة المعيارية للمرحلة (5–10 ساعات)."
        actions={
          <Button
            onClick={() => openCreate()}
            // Without a path to attach it to there is nothing to create.
            disabled={isLoadingPaths || (pathOptions?.length ?? 0) === 0}
          >
            <Plus />
            مرحلة جديدة
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={query.search}
              onValueChange={(value) => setFilter("search", value)}
              placeholder="ابحث باسم المرحلة أو المسار…"
              className="lg:max-w-xs"
            />

            <div className="flex flex-wrap items-center gap-2 lg:ms-auto">
              <Select
                items={pathItems}
                value={query.pathId}
                disabled={isLoadingPaths}
                onValueChange={(value) => setFilter("pathId", value as string)}
              >
                <SelectTrigger size="sm" className="w-44">
                  {/* A path id that is not in the loaded options — a stale URL,
                      or a path beyond the options limit — would otherwise
                      render as an empty trigger. */}
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
                items={CONTENT_ITEMS}
                value={query.content}
                onValueChange={(value) => setFilter("content", value as string)}
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_CONTENT_FILTERS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {STAGE_CONTENT_LABELS[option]}
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
                  {STAGE_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {STAGE_SORT_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {isPending ? (
            <DataTableSkeleton columns={4} rows={STAGES_PAGE_SIZE} />
          ) : isError ? (
            <ApiErrorState
              error={error}
              title="تعذّر تحميل المراحل"
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
                icon={Layers}
                title="لا توجد مراحل بعد"
                description="ابدأ بإضافة أول مرحلة إلى أحد المسارات، ثم أضف إليها الدروس والاختبارات."
                action={
                  // A stage needs a parent, so with no paths the only useful
                  // action is to go and create one.
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
                    <Button onClick={() => openCreate()}>
                      <Plus />
                      إنشاء مرحلة
                    </Button>
                  )
                }
              />
            )
          ) : (
            <>
              <StagesTable
                groups={data.items}
                onEdit={openEdit}
                onDelete={setPendingDelete}
                onCreateInPath={openCreate}
              />
              {/* The page counts paths, not stages — a path's stages are never
                  split across two pages — so the stage total is reported
                  alongside rather than as the paged figure. */}
              <DataPagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                isLoading={isFetching}
                itemLabel="مسار"
                details={`${formatNumber(data.totalStages)} مرحلة`}
                onPageChange={(page) => setParams({ page })}
              />
            </>
          )}
        </CardContent>
      </Card>

      <StageFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        stage={formTarget.stage}
        defaultPathId={formTarget.pathId}
        pathOptions={pathOptions ?? []}
      />

      <DeleteConfirmationDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        entityName={pendingDelete?.title ?? ""}
        description={
          pendingDelete && pendingDelete.lessonsCount > 0
            ? `سيتم حذف المرحلة و${pendingDelete.lessonsCount} درسًا و${pendingDelete.quizzesCount} اختبارًا مرتبطة بها نهائيًا. لا يمكن التراجع عن هذا الإجراء.`
            : "سيتم حذف المرحلة وكل ما يتفرع عنها نهائيًا. لا يمكن التراجع عن هذا الإجراء."
        }
        isPending={deleteStage.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;

          deleteStage.mutate(pendingDelete.id, {
            onSettled: () => setPendingDelete(null),
          });
        }}
      />
    </>
  );
}
