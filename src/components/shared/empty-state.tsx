import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional call to action — usually a `<Button>`. */
  action?: React.ReactNode;
  className?: string;
};

/**
 * Shown when a list has nothing in it. Domain-neutral: it takes an icon, copy,
 * and an optional action, and knows nothing about the entity being listed.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 rounded-2xl bg-muted p-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
