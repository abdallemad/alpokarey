import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Route } from "lucide-react";

import { EmptyState, PageContainer, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = { title: "المسارات" };

/**
 * `/paths` — the public catalog of learning tracks.
 *
 * A placeholder for now. It exists because every sidebar destination must
 * resolve to a real page: a nav item that 404s makes the shell impossible to
 * review — the same reasoning that gave the admin console its placeholders
 * (`admin-dashboard.md` §2).
 *
 * The real screen is `tracks-catalog-feature.md` in `folder-structure.md`.
 */
export default function PathsCatalogPage() {
  return (
    <PageContainer>
      <PageHeader
        title="المسارات"
        description="مسارات علمية متكاملة، من أساسيات ما لا يسع المسلم جهله إلى البرامج البحثية المتقدمة."
      />

      <Card>
        <CardContent className="px-0">
          <EmptyState
            icon={Route}
            title="كتالوج المسارات قيد الإعداد"
            description="سيظهر هنا كتالوج المسارات المنشورة مع التصنيفات والتسجيل. حتى ذلك الحين، تابع مسيرتك من لوحتك."
            action={
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={ROUTES.app.dashboard} />}
              >
                <ArrowRight />
                العودة إلى لوحتي
              </Button>
            }
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
