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
};

/**
 * Pager for admin tables.
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
}: DataPaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-4 pt-4 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        صفحة {formatNumber(page)} من {formatNumber(totalPages)} · إجمالي{" "}
        {formatNumber(total)} مسار
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
