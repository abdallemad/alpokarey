import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/shared/brand-lockup";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <BrandLockup />
        </Link>
        <nav className="hidden md:flex gap-6 items-center flex-1 justify-center text-sm font-medium">
          <Link href="#features" className="transition-colors hover:text-primary text-muted-foreground">المميزات</Link>
          <Link href="#paths" className="transition-colors hover:text-primary text-muted-foreground">المسارات</Link>
          <Link href="#about" className="transition-colors hover:text-primary text-muted-foreground">عن الأكاديمية</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden sm:flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">تسجيل الدخول</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">ابدأ الآن</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
