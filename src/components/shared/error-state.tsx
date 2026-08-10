import { RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  /** Re-runs the failed render. Wire this to the `retry` prop of `error.tsx`. */
  onRetry?: () => void;
  /**
   * Server-side error hash. Shown in small print so a user can quote it in a
   * support request and it can be matched against the server logs.
   */
  digest?: string;
  className?: string;
};

/**
 * What an admin sees when a segment throws.
 *
 * Deliberately non-technical: the real error message is withheld in production
 * to avoid leaking server details, so the copy explains the recovery instead.
 */
export function ErrorState({
  title = "تعذّر تحميل هذا القسم",
  description = "حدث خطأ غير متوقع أثناء جلب البيانات. يمكنك المحاولة مرة أخرى، وإذا تكرر الخطأ فتواصل مع الدعم الفني.",
  onRetry,
  digest,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 rounded-2xl bg-destructive/10 p-4">
        <TriangleAlert className="size-8 text-destructive" />
      </div>

      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>

      {onRetry ? (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RefreshCw />
          إعادة المحاولة
        </Button>
      ) : null}

      {digest ? (
        <p className="mt-4 font-mono text-xs text-muted-foreground/70">
          رمز الخطأ: {digest}
        </p>
      ) : null}
    </div>
  );
}
