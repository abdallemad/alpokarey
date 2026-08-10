"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, MoreHorizontal, Pencil, Route, Trash2 } from "lucide-react";

import {
  LessonAttachmentsBadge,
  LessonTypeBadge,
} from "@/components/admin/lessons/lesson-badges";
import { PathStatusBadge } from "@/components/admin/paths/path-badges";
import { DeleteConfirmationDialog } from "@/components/admin/shared";
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
import { useDeleteLesson } from "@/hooks/use-lesson";
import type { LessonListItem } from "@/types/lesson";
import { formatDate, formatNumber } from "@/utils/format";

/**
 * The lessons data table.
 *
 * Flat rather than grouped, unlike the stages table: a lesson's place in the
 * curriculum is two levels deep — path ▸ stage — which is more than a heading
 * row can carry, so each level gets a column of its own from `md` up and the
 * pair collapses into one line under the title below that.
 *
 * Secondary columns drop away below `md`/`lg` so the essentials — the lesson's
 * order, its title, its type and the row menu — stay readable on a phone
 * without horizontal scrolling.
 */
export function LessonsTable({ lessons }: { lessons: LessonListItem[] }) {
  const router = useRouter();
  const deleteLesson = useDeleteLesson();
  const [pendingDelete, setPendingDelete] =
    React.useState<LessonListItem | null>(null);

  const openLesson = (lessonId: string) =>
    router.push(`${ROUTES.admin.lessons}/${lessonId}`);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الدرس</TableHead>
            <TableHead>النوع</TableHead>
            <TableHead className="hidden md:table-cell">المسار</TableHead>
            <TableHead className="hidden md:table-cell">المرحلة</TableHead>
            <TableHead className="hidden lg:table-cell">المدة</TableHead>
            <TableHead className="hidden lg:table-cell">المرفقات</TableHead>
            <TableHead className="hidden xl:table-cell">تاريخ الإنشاء</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {lessons.map((lesson) => (
            <TableRow
              key={lesson.id}
              onClick={() => openLesson(lesson.id)}
              className="cursor-pointer"
            >
              <TableCell className="max-w-[24rem] whitespace-normal">
                <div className="flex items-center gap-2.5">
                  {/* Position inside its stage — the order a student studies
                      it in, not a row number. */}
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums">
                    {formatNumber(lesson.order)}
                  </span>
                  <span className="min-w-0 font-medium">{lesson.title}</span>
                </div>

                {/* Below `md` the stage column is hidden, so the curriculum
                    path rides under the title instead of disappearing. */}
                <p className="mt-1 line-clamp-1 ps-9.5 text-xs text-muted-foreground md:hidden">
                  {lesson.stage.path.title} ▸ {lesson.stage.title}
                </p>
              </TableCell>

              <TableCell>
                <LessonTypeBadge type={lesson.type} />
              </TableCell>

              <TableCell className="hidden max-w-[14rem] whitespace-normal md:table-cell">
                <div className="flex items-center gap-2">
                  <Route className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-1 text-sm">
                    {lesson.stage.path.title}
                  </span>
                </div>
                <div className="mt-1 ps-5.5">
                  <PathStatusBadge status={lesson.stage.path.status} />
                </div>
              </TableCell>

              <TableCell className="hidden max-w-[14rem] whitespace-normal md:table-cell">
                <div className="flex items-center gap-2">
                  <Layers className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-1 text-sm">
                    {/* The stage's own position in its path — context for the
                        lesson's `order`, which is scoped to this stage. */}
                    <span className="text-muted-foreground tabular-nums">
                      {formatNumber(lesson.stage.order)}.
                    </span>{" "}
                    {lesson.stage.title}
                  </span>
                </div>
              </TableCell>

              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {lesson.duration ?? "—"}
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <LessonAttachmentsBadge count={lesson.attachmentsCount} />
              </TableCell>

              <TableCell className="hidden text-muted-foreground xl:table-cell">
                {formatDate(lesson.createdAt)}
              </TableCell>

              <TableCell>
                {/* Stop the row's navigation handler from firing when the menu
                    itself is being used. */}
                <div onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`إجراءات ${lesson.title}`}
                        />
                      }
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="min-w-44">
                      <DropdownMenuItem
                        render={
                          <Link
                            href={`${ROUTES.admin.lessons}/${lesson.id}`}
                          />
                        }
                      >
                        <Pencil />
                        تعديل الدرس
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        render={
                          <Link
                            href={`${ROUTES.admin.stages}?pathId=${lesson.stage.path.id}`}
                          />
                        }
                      >
                        <Layers />
                        مراحل المسار
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setPendingDelete(lesson)}
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
        </TableBody>
      </Table>

      <DeleteConfirmationDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        entityName={pendingDelete?.title ?? ""}
        description={
          pendingDelete && pendingDelete.attachmentsCount > 0
            ? `سيتم حذف الدرس و${formatNumber(pendingDelete.attachmentsCount)} مرفقًا مرتبطًا به نهائيًا، بما في ذلك الملفات المرفوعة. لا يمكن التراجع عن هذا الإجراء.`
            : "سيتم حذف الدرس وكل ما يتفرع عنه نهائيًا. لا يمكن التراجع عن هذا الإجراء."
        }
        isPending={deleteLesson.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;

          deleteLesson.mutate(pendingDelete.id, {
            onSettled: () => setPendingDelete(null),
          });
        }}
      />
    </>
  );
}
