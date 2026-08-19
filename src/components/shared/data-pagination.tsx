"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/utils/format";

type DataPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Dims the controls while a page is in flight. */
  isLoading?: boolean;
  /** The thing being counted, e.g. "مسار" or "مرحلة". */
  itemLabel?: string;
  /** A second figure appended to the summary, when one number is not enough. */
  details?: string;
};

/**
 * The pager, for anything paginated.
 *
 * It lives in `components/shared` rather than under `admin/` because the public
 * catalog at `/paths` needs the identical control, and a second pager would be
 * a second set of RTL chevrons to get wrong. `components/admin/shared`
 * re-exports it, so no admin import had to change when it moved — the same
 * route `PageHeader` and `SearchInput` already took.
 *
 * Domain-neutral by contract: it takes numbers and a callback, and knows
 * nothing about what is being paged. `itemLabel` is what lets the summary line
 * read "12 مسار" on one screen and "30 درس" on another.
 *
 * The chevrons are mirrored for RTL on purpose: in Arabic, "previous" points
 * right and "next" points left.
 */
export function DataPagination({
  page,
  totalPages,
  total,
  onPageChange,
  isLoading = false,
  itemLabel = "عنصر",
  details,
}: DataPaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-4 pt-4 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        صفحة {formatNumber(page)} من {formatNumber(totalPages)} · إجمالي{" "}
        {formatNumber(total)} {itemLabel}
        {details ? ` · ${details}` : null}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronRight />
          السابق
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
        >
          التالي
          <ChevronLeft />
        </Button>
      </div>
    </div>
  );
}
