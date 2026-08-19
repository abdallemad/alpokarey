import type { Metadata } from "next";

import { PathOverviewView } from "@/components/paths";

export const metadata: Metadata = {
  title: "تفاصيل المسار | أكاديمية الإمام البخاري",
};

/**
 * `/paths/[pathId]` — one path, its curriculum, and the way into it.
 *
 * ### Why it lives in `(marketing)`
 *
 * Its first audience is a visitor with no account: the landing page's catalog
 * cards link straight here, and the whole point of the page is to turn a
 * reader into a student. So it renders in the public shell — site header, site
 * footer — rather than in the dashboard's. An enrolled learner reaching it
 * from `/dashboard/paths` sees the same page; what differs is the card in the
 * aside, not the chrome around it.
 *
 * That is also why it is **not** `/dashboard/paths/[pathId]`:
 * `docs/dashboard-restructure.md` made `/dashboard/*` mean "renders in the
 * dashboard shell", and this does not.
 *
 * ### A thin Server Component
 *
 * Like every other page in this product, the data is fetched client-side
 * through React Query — here for a reason particular to this page: the
 * response depends on the session, because it carries the viewer's own
 * enrolment state. See `components/paths/path-overview-view.tsx`.
 *
 * ### The title
 *
 * Static, and generic. Naming the path in the tab would mean a database read
 * in `generateMetadata`, and `docs/folder-structure.md` is explicit that pages
 * do not call Services — the same trade-off `/dashboard/certificates/[id]`
 * already made. It costs more here, because this is a public page a search
 * engine may index, so it is recorded as an open question in
 * `docs/path-detail-feature.md` §9 rather than quietly settled.
 *
 * `params` is a Promise in Next 16, so it is awaited before the id reaches the
 * client view that fetches with it.
 */
export default async function PathDetailPage({
  params,
}: PageProps<"/paths/[pathId]">) {
  const { pathId } = await params;

  return <PathOverviewView pathId={pathId} />;
}
