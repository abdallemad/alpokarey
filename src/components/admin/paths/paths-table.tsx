"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  PathCategoryBadge,
  PathFeaturedBadge,
  PathStatusBadge,
} from "@/components/admin/paths/path-badges";
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
import { useDeletePath } from "@/hooks/use-path";
import type { PathListItem } from "@/types/path";
import { formatDate, formatNumber } from "@/utils/format";

/**
 * The paths data table.
 *
 * Secondary columns drop away below `lg` so the essentials — title, status and
 * the row menu — stay readable on a phone without horizontal scrolling.
 */
export function PathsTable({ paths }: { paths: PathListItem[] }) {
  const router = useRouter();
  const deletePath = useDeletePath();
  const [pendingDelete, setPendingDelete] = React.useState<PathListItem | null>(
    null,
  );

  const openPath = (pathId: string) =>
    router.push(`${ROUTES.admin.paths}/${pathId}`);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العنوان</TableHead>
            <TableHead className="hidden md:table-cell">التصنيف</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="hidden lg:table-cell">المراحل</TableHead>
            <TableHead className="hidden lg:table-cell">التسجيلات</TableHead>
            <TableHead className="hidden xl:table-cell">تاريخ الإنشاء</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {paths.map((path) => (
            <TableRow
              key={path.id}
              onClick={() => openPath(path.id)}
              className="cursor-pointer"
            >
              <TableCell className="max-w-[22rem] whitespace-normal">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{path.title}</span>
                  <PathFeaturedBadge isFeatured={path.isFeatured} />
                </div>
                {path.description ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {path.description}
                  </p>
                ) : null}
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <PathCategoryBadge category={path.category} />
              </TableCell>

              <TableCell>
                <PathStatusBadge status={path.status} />
              </TableCell>

              <TableCell className="hidden tabular-nums lg:table-cell">
                {formatNumber(path.stagesCount)}
              </TableCell>

              <TableCell className="hidden tabular-nums lg:table-cell">
                {formatNumber(path.enrollmentsCount)}
              </TableCell>

              <TableCell className="hidden text-muted-foreground xl:table-cell">
                {formatDate(path.createdAt)}
              </TableCell>

              <TableCell>
                {/* Stop the row's navigation handler from firing when the
                    menu itself is being used. */}
                <div onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`إجراءات ${path.title}`}
                        />
                      }
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="min-w-44">
                      <DropdownMenuItem
                        render={
                          <Link href={`${ROUTES.admin.paths}/${path.id}`} />
                        }
                      >
                        <Eye />
                        عرض التفاصيل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        render={
                          <Link
                            href={`${ROUTES.admin.paths}/${path.id}#تعديل`}
                          />
                        }
                      >
                        <Pencil />
                        تعديل
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setPendingDelete(path)}
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
        description="سيتم حذف المسار وكل مراحله ودروسه واختباراته نهائيًا. لا يمكن التراجع عن هذا الإجراء."
        isPending={deletePath.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;

          deletePath.mutate(pendingDelete.id, {
            onSettled: () => setPendingDelete(null),
          });
        }}
      />
    </>
  );
}
