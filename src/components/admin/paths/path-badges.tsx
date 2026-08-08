import type { PathCategory, Status } from "@prisma/client";
import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  PATH_CATEGORY_CLASSES,
  PATH_CATEGORY_LABELS,
  PATH_STATUS_LABELS,
} from "@/constants/path";
import { cn } from "@/lib/utils";

/** DRAFT vs PUBLISHED. Draft is deliberately quiet; published reads as active. */
export function PathStatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "PUBLISHED"
          ? "border-success/30 bg-success/10 text-success"
          : "text-muted-foreground",
      )}
    >
      {PATH_STATUS_LABELS[status]}
    </Badge>
  );
}

/** Category chip, tinted with that category's token from the design system. */
export function PathCategoryBadge({
  category,
}: {
  category: PathCategory | null;
}) {
  if (!category) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <Badge className={cn("border-transparent", PATH_CATEGORY_CLASSES[category])}>
      {PATH_CATEGORY_LABELS[category]}
    </Badge>
  );
}

export function PathFeaturedBadge({ isFeatured }: { isFeatured: boolean }) {
  if (!isFeatured) return null;

  return (
    <Badge className="border-transparent bg-gold/15 text-gold-foreground dark:text-gold">
      <Star />
      مميز
    </Badge>
  );
}
