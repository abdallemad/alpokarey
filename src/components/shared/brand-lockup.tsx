import { BookOpenText } from "lucide-react";

import { cn } from "@/lib/utils";

type BrandLockupProps = {
  /** Small caption under the academy name — e.g. `لوحة التحكم` in the admin shell. */
  subtitle?: string;
  className?: string;
  /**
   * Applied to the text block only. The admin sidebar passes
   * `group-data-[collapsible=icon]:hidden` so the mark survives icon mode while
   * the wordmark drops away — this component stays unaware of sidebars.
   */
  textClassName?: string;
};

/**
 * The academy mark plus its name. Shared by the marketing header, the learner
 * sidebar, and the admin sidebar so the brand reads identically everywhere.
 */
export function BrandLockup({
  subtitle,
  className,
  textClassName,
}: BrandLockupProps) {
  return (
    <div className={cn("flex items-center gap-2 overflow-hidden", className)}>
      <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BookOpenText className="size-4" />
      </div>
      <div
        className={cn("grid flex-1 text-start leading-tight", textClassName)}
      >
        <span className="truncate font-heading text-sm font-bold">
          أكاديمية الإمام البخاري
        </span>
        {subtitle ? (
          <span className="truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
