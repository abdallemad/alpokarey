import type { Metadata } from "next";

import { LessonView } from "@/components/app/learn";

export const metadata: Metadata = { title: "الدرس" };

/**
 * `/learn/[pathId]/lesson/[lessonId]` — one lesson, open in the player.
 *
 * The `lesson` segment is not decoration: `quiz` sits beside it, and a URL that
 * says which of the two it points at is one the reader and the router can both
 * answer without guessing.
 */
export default async function LearnLessonPage({
  params,
}: PageProps<"/learn/[pathId]/lesson/[lessonId]">) {
  const { pathId, lessonId } = await params;

  return <LessonView pathId={pathId} lessonId={lessonId} />;
}
