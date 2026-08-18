import { LearnEntryView } from "@/components/app/learn";

/**
 * `/learn/[pathId]` — the path opened with no lesson named.
 *
 * Sends the learner to the first lesson they have not finished. It is a real
 * destination rather than a 404 because "open my path" is what a link from
 * anywhere else in the product means, and because the resume target is a
 * question only the learner's own progress can answer.
 */
export default async function LearnEntryPage({
  params,
}: PageProps<"/learn/[pathId]">) {
  const { pathId } = await params;

  return <LearnEntryView pathId={pathId} />;
}
