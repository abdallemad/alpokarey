import { LearnShell } from "@/components/app/learn";

/**
 * `/learn/[pathId]` — the player shell every lesson and exam renders inside.
 *
 * A layout rather than a piece of each page, because that is what keeps the
 * curriculum mounted: Next does not unmount a layout when its children change,
 * so moving from a lesson to the next one swaps the content column while the
 * sidebar — and the request behind it — stays exactly as it was.
 *
 * It sits a segment below `(learn)/layout.tsx` because the sidebar cannot be
 * built without a path id: the group's layout owns the providers, this one owns
 * the path.
 *
 * No `metadata` export here — the title belongs to the lesson or the exam
 * actually open, which is a segment further down again. The group's layout
 * supplies the default.
 *
 * `params` is a Promise in Next 16, so it is awaited before the id reaches the
 * client shell that fetches with it.
 */
export default async function LearnLayout({
  children,
  params,
}: LayoutProps<"/learn/[pathId]">) {
  const { pathId } = await params;

  return <LearnShell pathId={pathId}>{children}</LearnShell>;
}
