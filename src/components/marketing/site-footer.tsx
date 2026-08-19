import Link from "next/link";

import { MarketingAccountLinks } from "@/components/marketing/marketing-account-links";
import { BrandLockup } from "@/components/shared";
import {
  ACADEMY_VISION,
  MARKETING_FOOTER_LINKS,
  MARKETING_PATHS,
  type MarketingNavItem,
} from "@/constants/marketing";

/**
 * The public site's footer.
 *
 * Rebuilt around one rule: **no link points at `#`.** The previous footer had
 * seven dead links — four path names, an FAQ and a contact page that do not
 * exist — and a dead link in a footer is worse than a missing one, because a
 * visitor spends a click discovering it leads nowhere.
 *
 * What remains is what actually resolves: the sections of this page, whichever
 * account routes apply to this visitor, and the path names as **text**. The
 * paths are listed without links on purpose — they are the planned curriculum
 * from `business-analysis.md` §3.4, and there is no public catalog page to send
 * anyone to. Naming them is honest; linking them would not be.
 *
 * A Server Component apart from the "حسابك" column, which has to know whether
 * anyone is signed in.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
          {/* The brand column spans the full width on a phone, where a 50%
              column would wrap the vision line every three words. */}
          <div className="col-span-2 space-y-4 sm:col-span-3 lg:col-span-1">
            <BrandLockup subtitle="لخدمة السنة النبوية" />

            <p className="max-w-xs font-heading text-base font-bold text-primary">
              {ACADEMY_VISION}
            </p>

            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              مشروع تعليمي إلكتروني لإحياء الاهتمام بالسنة النبوية عبر منهجٍ
              علمي رصين يربط الحديث بمختلف العلوم الشرعية والحياتية.
            </p>
          </div>

          <FooterColumn title="الأكاديمية" links={MARKETING_FOOTER_LINKS} />

          <div>
            <h3 className="font-heading text-sm font-bold">المسارات</h3>
            <ul className="mt-4 space-y-3">
              {MARKETING_PATHS.slice(0, 4).map((path) => (
                <li key={path.title} className="text-sm text-muted-foreground">
                  {path.title}
                </li>
              ))}
            </ul>
          </div>

          {/* Auth-aware, so the footer cannot offer "إنشاء حساب" to someone
              the header is already greeting by name. */}
          <div>
            <h3 className="font-heading text-sm font-bold">حسابك</h3>
            <MarketingAccountLinks />
          </div>
        </div>

        <div className="mt-12 border-t border-border/60 pt-8">
          <p className="text-xs leading-5 text-muted-foreground">
            © {new Date().getFullYear()} أكاديمية الإمام البخاري. جميع الحقوق
            محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: MarketingNavItem[];
}) {
  return (
    <div>
      <h3 className="font-heading text-sm font-bold">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
