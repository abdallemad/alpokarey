import { Suspense } from "react";
import type { Metadata } from "next";

import { PathsCatalogSkeleton, PathsCatalogView } from "@/components/paths";

export const metadata: Metadata = {
  title: "المسارات | أكاديمية الإمام البخاري",
  description:
    "مسارات أكاديمية الإمام البخاري التعليمية: مراحل متدرّجة ودروس واختبارات وشهادات إتمام، في الفقه والعقيدة والسيرة والتفسير وشؤون الحياة.",
};

/**
 * `/paths` — the public catalog.
 *
 * The destination the landing page's teaser, the header nav and the footer all
 * point at, and the parent of `/paths/[pathId]`.
 *
 * A thin Server Component: the list is fetched client-side so the filters can
 * live in the URL without a server round trip per keystroke, and so React Query
 * can hold the previous page on screen while the next one loads. See
 * `components/paths/paths-catalog-view.tsx`.
 *
 * The `<Suspense>` boundary is required, not decorative — `PathsCatalogView`
 * reads `useSearchParams()`, and Next.js opts any component that does so out of
 * prerendering unless it sits inside one.
 *
 * Unlike `/paths/[pathId]`, this page **can** carry a real title and
 * description: they describe the catalog rather than any particular path, so
 * no database read is needed to write them. The detail page's generic title is
 * the open question recorded in `docs/path-detail-feature.md` §9.
 */
export default function PathsCatalogPage() {
  return (
    <Suspense fallback={<PathsCatalogSkeleton />}>
      <PathsCatalogView />
    </Suspense>
  );
}
