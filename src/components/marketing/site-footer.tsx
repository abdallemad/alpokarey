import Link from "next/link";
import { BrandLockup } from "@/components/shared/brand-lockup";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <BrandLockup />
            <p className="text-sm text-muted-foreground leading-6 max-w-xs">
              مشروع تعليمي إلكتروني يهدف إلى إحياء الاهتمام بالسنة النبوية الشريفة عبر منهج علمي رصين يربط الحديث بمختلف العلوم الشرعية والحياتية.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-foreground font-heading">
                  المسارات التعليمية
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link href="#" className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors">
                      السنة والأسرة
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors">
                      السنة والاقتصاد
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors">
                      السنة والطب
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors">
                      السنة والمجتمع
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-foreground font-heading">
                  روابط سريعة
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link href="#features" className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors">
                      المميزات
                    </Link>
                  </li>
                  <li>
                    <Link href="#about" className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors">
                      عن الأكاديمية
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-in" className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors">
                      تسجيل الدخول
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-foreground font-heading">
                  الدعم والمساعدة
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link href="#" className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors">
                      الأسئلة الشائعة
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm leading-6 text-muted-foreground hover:text-primary transition-colors">
                      تواصل معنا
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-border/40 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-muted-foreground">
            &copy; {new Date().getFullYear()} أكاديمية الإمام البخاري. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
