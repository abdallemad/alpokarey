import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/shared";
import { AdminBreadcrumbs } from "./admin-breadcrumbs";
import { AdminCommandMenu } from "./admin-command-menu";

/**
 * The sticky bar above every admin page: sidebar toggle, location trail, and
 * the global actions.
 *
 * A Server Component on purpose — it holds no state, so only the three
 * interactive children ship JavaScript. It stays sticky rather than fixed so it
 * never overlaps the content beneath it.
 */
export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md md:px-4">
      <SidebarTrigger className="-ms-1 shrink-0" />
      <Separator
        orientation="vertical"
        className="data-vertical:h-4 data-vertical:self-center"
      />
      <AdminBreadcrumbs />

      <div className="ms-auto flex shrink-0 items-center gap-1">
        <AdminCommandMenu />
        <ThemeToggle />
      </div>
    </header>
  );
}
