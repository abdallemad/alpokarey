import { cn } from "@/lib/utils";

/**
 * The padded column every admin page renders into.
 *
 * The sidebar already constrains the width, so this only owns the gutter and
 * the rhythm between sections. Padding tightens on small screens where
 * horizontal space is scarce.
 */
export function PageContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-container"
      className={cn("flex flex-1 flex-col gap-6 p-4 md:p-6", className)}
      {...props}
    />
  );
}
