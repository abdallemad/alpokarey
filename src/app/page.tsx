import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Scale, GraduationCap, ChevronLeft } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-primary/5 py-24 sm:py-32 lg:pb-32 lg:pt-40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="outline" className="mb-6 rounded-full border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-4 py-1 text-sm">
              أكاديمية تعليمية متكاملة
            </Badge>
            <h1 className="font-heading mx-auto max-w-4xl font-bold tracking-tight text-foreground text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              جيلٌ ربانيٌّ <span className="text-primary">يُحيي السنة</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-muted-foreground sm:text-xl">
              نقدم تعليماً راسخاً ومنهجاً موثوقاً لربط الحديث النبوي بمختلف العلوم الشرعية والحياتية. 
              ابدأ رحلتك في تعلم السنة النبوية اليوم.
            </p>
            <div className="mt-10 flex justify-center gap-x-6">
              {/* Base UI, not Radix: a Button that renders an anchor takes
                  `render` plus `nativeButton={false}` — see
                  docs/paths-feature.md §13. */}
              <Button
                size="lg"
                className="h-12 px-8 text-base"
                nativeButton={false}
                render={<Link href="/sign-up" />}
              >
                ابدأ التعلم الآن
                <ChevronLeft className="ms-2 size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base"
                nativeButton={false}
                render={<Link href="#paths" />}
              >
                استكشف المسارات
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                لماذا أكاديمية الإمام البخاري؟
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                نسعى لتقديم محتوى تعليمي مميز يجمع بين الأصالة والمعاصرة
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-5xl sm:mt-20 lg:mt-24">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
                <div className="relative ps-16">
                  <dt className="text-base font-semibold leading-7 text-foreground">
                    <div className="absolute start-0 top-0 flex size-10 items-center justify-center rounded-lg bg-primary">
                      <Scale className="size-6 text-primary-foreground" />
                    </div>
                    الوسطية والاعتدال
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-muted-foreground">
                    التوازن بين دراسة السنة والمذاهب الفقهية دون إفراط أو تفريط، وفق منهج السلف الصالح.
                  </dd>
                </div>
                <div className="relative ps-16">
                  <dt className="text-base font-semibold leading-7 text-foreground">
                    <div className="absolute start-0 top-0 flex size-10 items-center justify-center rounded-lg bg-primary">
                      <BookOpen className="size-6 text-primary-foreground" />
                    </div>
                    ربط السنة بالعلوم
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-muted-foreground">
                    تأكيد تكامل السنة مع العلوم الأخرى كالتفسير، الفقه، الطب، والاقتصاد.
                  </dd>
                </div>
                <div className="relative ps-16">
                  <dt className="text-base font-semibold leading-7 text-foreground">
                    <div className="absolute start-0 top-0 flex size-10 items-center justify-center rounded-lg bg-primary">
                      <GraduationCap className="size-6 text-primary-foreground" />
                    </div>
                    إشراف علمي موثوق
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-muted-foreground">
                    الاستعانة بكبار العلماء في الإشراف، اللقاءات، الاختبارات، والإجابة على الأسئلة.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Paths Section */}
        <section id="paths" className="bg-muted/50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                مسارات تعليمية متكاملة
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                اختر المسار الذي يناسب اهتمامك وتدرج في طلب العلم بخطى ثابتة
              </p>
            </div>
            
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {/* Path 1 */}
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="mb-4">
                    <Badge className="bg-category-life-affairs text-white hover:bg-category-life-affairs/90">شؤون الحياة</Badge>
                  </div>
                  <CardTitle className="font-heading text-xl">السنة والأسرة</CardTitle>
                  <CardDescription className="text-base mt-2">
                    دراسة هدي النبي ﷺ في الزواج، التربية، والتعامل مع المشكلات الأسرية لبناء بيت مسلم مستقر.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="size-4" />
                    <span>مفتوح للجميع</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    nativeButton={false}
                    render={<Link href="/sign-up" />}
                  >
                    التسجيل في المسار
                  </Button>
                </CardFooter>
              </Card>

              {/* Path 2 */}
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="mb-4">
                    <Badge className="bg-category-life-affairs text-white hover:bg-category-life-affairs/90">شؤون الحياة</Badge>
                  </div>
                  <CardTitle className="font-heading text-xl">السنة والاقتصاد</CardTitle>
                  <CardDescription className="text-base mt-2">
                    فهم فقه البيوع والمعاملات المالية المعاصرة في ضوء السنة النبوية، وكيفية تطبيقها اليوم.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="size-4" />
                    <span>للباحثين والمهتمين</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    nativeButton={false}
                    render={<Link href="/sign-up" />}
                  >
                    التسجيل في المسار
                  </Button>
                </CardFooter>
              </Card>

              {/* Path 3 */}
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="mb-4">
                    <Badge className="bg-category-fiqh text-white hover:bg-category-fiqh/90">الفقه</Badge>
                  </div>
                  <CardTitle className="font-heading text-xl">السنة وأصول الفقه</CardTitle>
                  <CardDescription className="text-base mt-2">
                    مسار متقدم يربط بين أحاديث الأحكام والقواعد الأصولية لتعزيز القدرة على استنباط الأحكام.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="size-4" />
                    <span>لطلاب العلم</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    nativeButton={false}
                    render={<Link href="/sign-up" />}
                  >
                    التسجيل في المسار
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative isolate overflow-hidden bg-primary px-6 py-24 text-center shadow-2xl sm:px-16">
          <h2 className="mx-auto max-w-2xl font-heading text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            انضم إلى آلاف الطلاب اليوم
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
            سجل الآن وابدأ رحلتك في طلب العلم الشرعي وفق منهجية علمية معتمدة ومتدرجة.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-8 text-base text-primary font-semibold"
              nativeButton={false}
              render={<Link href="/sign-up" />}
            >
              إنشاء حساب جديد
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
