"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, MoreHorizontal, Pencil, Route, Trash2 } from "lucide-react";

import { PathStatusBadge } from "@/components/admin/paths/path-badges";
import {
  QuizActiveBadge,
  QuizKindBadge,
  QuizQuestionsBadge,
} from "@/components/admin/quizzes/quiz-badges";
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
import { useDeleteQuiz } from "@/hooks/use-quiz";
import type { QuizListItem } from "@/types/quiz";
import { formatNumber } from "@/utils/format";

/**
 * The exams data table.
 *
 * The column that matters most is **النوع**: an exam is either a stage's final
 * or a lesson's, and for a lesson-linked one the lesson's title sits directly
 * under the badge — that pairing is the question the screen exists to answer.
 *
 * Secondary columns drop away below `md`/`lg` so the essentials — the exam's
 * order, its title, how it is attached and the row menu — stay readable on a
 * phone without horizontal scrolling.
 */
export function QuizzesTable({ quizzes }: { quizzes: QuizListItem[] }) {
  const router = useRouter();
  const deleteQuiz = useDeleteQuiz();
  const [pendingDelete, setPendingDelete] = React.useState<QuizListItem | null>(
    null,
  );

  const openQuiz = (quizId: string) =>
    router.push(`${ROUTES.admin.quizzes}/${quizId}`);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاختبار</TableHead>
            <TableHead>النوع</TableHead>
            <TableHead className="hidden md:table-cell">المسار</TableHead>
            <TableHead className="hidden md:table-cell">المرحلة</TableHead>
            <TableHead className="hidden lg:table-cell">الأسئلة</TableHead>
            <TableHead className="hidden lg:table-cell">درجة النجاح</TableHead>
            <TableHead className="hidden xl:table-cell">المحاولات</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {quizzes.map((quiz) => (
            <TableRow
              key={quiz.id}
              onClick={() => openQuiz(quiz.id)}
              className="cursor-pointer"
            >
              <TableCell className="max-w-[22rem] whitespace-normal">
                <div className="flex items-center gap-2.5">
                  {/* Position inside its stage — exams and lessons are ordered
                      separately, each within the stage. */}
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums">
                    {formatNumber(quiz.order)}
                  </span>
                  <span className="min-w-0 font-medium">{quiz.title}</span>
                </div>

                {/* Below `md` the curriculum columns are hidden, so the chain
                    rides under the title instead of disappearing. */}
                <p className="mt-1 line-clamp-1 ps-9.5 text-xs text-muted-foreground md:hidden">
                  {quiz.stage.path.title} ▸ {quiz.stage.title}
                </p>
              </TableCell>

              <TableCell className="max-w-[14rem] whitespace-normal">
                <QuizKindBadge kind={quiz.kind} short />
                {/* Which lesson, not just "a lesson" — otherwise the badge
                    raises a question it does not answer. */}
                {quiz.kind === "LESSON" && quiz.linkedLessons.length > 0 ? (
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {quiz.linkedLessons.map((lesson) => lesson.title).join("، ")}
                  </p>
                ) : null}
              </TableCell>

              <TableCell className="hidden max-w-[13rem] whitespace-normal md:table-cell">
                <div className="flex items-center gap-2">
                  <Route className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-1 text-sm">
                    {quiz.stage.path.title}
                  </span>
                </div>
                <div className="mt-1 ps-5.5">
                  <PathStatusBadge status={quiz.stage.path.status} />
                </div>
              </TableCell>

              <TableCell className="hidden max-w-[13rem] whitespace-normal md:table-cell">
                <div className="flex items-center gap-2">
                  <Layers className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-1 text-sm">
                    <span className="text-muted-foreground tabular-nums">
                      {formatNumber(quiz.stage.order)}.
                    </span>{" "}
                    {quiz.stage.title}
                  </span>
                </div>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <QuizQuestionsBadge count={quiz.questionsCount} />
              </TableCell>

              <TableCell className="hidden tabular-nums lg:table-cell">
                {formatNumber(quiz.passingScore)}%
              </TableCell>

              <TableCell className="hidden tabular-nums xl:table-cell">
                {formatNumber(quiz.attemptsCount)}
              </TableCell>

              <TableCell>
                <QuizActiveBadge active={quiz.active} />
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
                          aria-label={`إجراءات ${quiz.title}`}
                        />
                      }
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="min-w-44">
                      <DropdownMenuItem
                        render={
                          <Link href={`${ROUTES.admin.quizzes}/${quiz.id}`} />
                        }
                      >
                        <Pencil />
                        تعديل الاختبار
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        render={
                          <Link
                            href={`${ROUTES.admin.lessons}?pathId=${quiz.stage.path.id}&stageId=${quiz.stage.id}`}
                          />
                        }
                      >
                        <Layers />
                        دروس المرحلة
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setPendingDelete(quiz)}
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
          pendingDelete && pendingDelete.attemptsCount > 0
            ? `يوجد ${formatNumber(pendingDelete.attemptsCount)} محاولة مسجّلة لهذا الاختبار، ولن يسمح النظام بحذفه. ألغِ تفعيله بدلًا من ذلك.`
            : "سيتم حذف الاختبار وكل أسئلته وخياراته نهائيًا. لا يمكن التراجع عن هذا الإجراء."
        }
        isPending={deleteQuiz.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;

          deleteQuiz.mutate(pendingDelete.id, {
            onSettled: () => setPendingDelete(null),
          });
        }}
      />
    </>
  );
}
