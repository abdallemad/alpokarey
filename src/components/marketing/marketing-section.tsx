import { cn } from "@/lib/utils";

/**
 * The frame every landing-page section renders into.
 *
 * Seven sections, one rhythm: the same max width, the same page gutters, the
 * same vertical breathing room, the same centred heading block. Written once so
 * a section cannot quietly drift to `py-20` and break the page's cadence — the
 * rule `design-system.md` §4 asks for, applied to the marketing surface.
 *
 * `id` is required rather than optional because every section is an anchor
 * target for the header nav; a section with no id is a nav item that scrolls
 * nowhere.
 */
export function MarketingSection({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      // `scroll-mt` clears the sticky header: without it an anchor jump puts
      // the section's heading underneath the bar that is covering it.
      className={cn("scroll-mt-20 py-16 sm:py-24", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/** Eyebrow, title and lead — centred, and never wider than a readable measure. */
export function MarketingSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
      ) : null}

      <h2 className="mt-2 font-heading text-3xl font-bold text-balance sm:text-4xl">
        {title}
      </h2>

      {description ? (
        <p className="mt-4 text-base leading-7 text-muted-foreground text-pretty sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
