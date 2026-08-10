"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  PathCategoryBadge,
  PathStatusBadge,
} from "@/components/admin/paths/path-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import type { StageGroup, StageListItem } from "@/types/stage";
import { formatDate, formatNumber } from "@/utils/format";

/** Columns the group heading has to span — keep in sync with `<TableHeader>`. */
const COLUMN_COUNT = 5;

type StagesTableProps = {
  /** One block per path, already complete — the API never splits a path. */
  groups: StageGroup[];
  /** Clicking a row — or its "تعديل" item — opens the edit dialog. */
  onEdit: (stage: StageListItem) => void;
  onDelete: (stage: StageListItem) => void;
  /** Creating from a group heading pre-selects that path. */
  onCreateInPath: (pathId: string) => void;
};

/**
 * The stages data table, grouped by parent path.
 *
 * A stage means nothing without its path, so instead of repeating the path in
 * every row, each path gets a heading row and its stages are listed under it.
 * The heading carries the path's status and category, links to the path, and
 * offers "add a stage here" with that path already chosen.
 *
 * Secondary columns drop away below `md`/`lg` so the essentials — the stage's
 * order, its title and the row menu — stay readable on a phone without
 * horizontal scrolling.
 */
export function StagesTable({
  groups,
  onEdit,
  onDelete,
  onCreateInPath,
}: StagesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>المرحلة</TableHead>
          <TableHead className="hidden md:table-cell">الدروس</TableHead>
          <TableHead className="hidden lg:table-cell">الاختبارات</TableHead>
          <TableHead className="hidden xl:table-cell">تاريخ الإنشاء</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>

      <TableBody>
        {groups.map((group) => (
          <React.Fragment key={group.path.id}>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableCell colSpan={COLUMN_COUNT} className="py-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="font-heading text-sm font-bold">
                    {group.path.title}
                  </span>

                  <PathStatusBadge status={group.path.status} />
                  <PathCategoryBadge category={group.path.category} />

                  <Badge variant="secondary" className="tabular-nums">
                    {formatNumber(group.stages.length)} مرحلة
                  </Badge>

                  <div className="ms-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCreateInPath(group.path.id)}
                    >
                      <Plus />
                      مرحلة هنا
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link href={`${ROUTES.admin.paths}/${group.path.id}`} />
                      }
                    >
                      عرض المسار
                      <ArrowLeft />
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>

            {group.stages.map((stage) => (
              <TableRow
                key={stage.id}
                onClick={() => onEdit(stage)}
                className="cursor-pointer"
              >
                <TableCell className="max-w-[24rem] whitespace-normal">
                  <div className="flex items-center gap-2.5">
                    {/* The stage's position inside its path — the sequence a
                        student studies it in, not a row number. */}
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums">
                      {formatNumber(stage.order)}
                    </span>
                    <span className="min-w-0 font-medium">{stage.title}</span>
                  </div>

                  {/* Below `md` the count columns are hidden, so the numbers
                      ride along under the title instead of disappearing. */}
                  <div className="mt-1 flex items-center gap-3 ps-9.5 text-xs text-muted-foreground md:hidden">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="size-3.5" />
                      {formatNumber(stage.lessonsCount)} درس
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClipboardCheck className="size-3.5" />
                      {formatNumber(stage.quizzesCount)} اختبار
                    </span>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {stage.lessonsCount === 0 ? (
                    <span className="text-xs text-warning">بدون دروس</span>
                  ) : (
                    <span className="tabular-nums">
                      {formatNumber(stage.lessonsCount)}
                    </span>
                  )}
                </TableCell>

                <TableCell className="hidden tabular-nums lg:table-cell">
                  {formatNumber(stage.quizzesCount)}
                </TableCell>

                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  {formatDate(stage.createdAt)}
                </TableCell>

                <TableCell>
                  {/* Stop the row's edit handler from firing when the menu
                      itself is being used. */}
                  <div onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`إجراءات ${stage.title}`}
                          />
                        }
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="min-w-44">
                        <DropdownMenuItem onClick={() => onEdit(stage)}>
                          <Pencil />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          render={
                            <Link
                              href={`${ROUTES.admin.paths}/${stage.path.id}`}
                            />
                          }
                        >
                          <ArrowLeft />
                          عرض المسار
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(stage)}
                        >
                          <Trash2 />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
