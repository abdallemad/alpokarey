import type { Metadata } from "next";

import { QuizView } from "@/components/app/learn";

export const metadata: Metadata = { title: "الاختبار" };

/**
 * `/learn/[pathId]/quiz/[quizId]` — an exam, inside the same player shell.
 *
 * `key={quizId}` is load-bearing. The runner keeps the phase (intro, running,
 * result) and the answers in component state, and React would otherwise reuse
 * that instance when a learner moves from one exam to the next — carrying a
 * previous exam's result screen onto a fresh exam.
 */
export default async function LearnQuizPage({
  params,
}: PageProps<"/learn/[pathId]/quiz/[quizId]">) {
  const { pathId, quizId } = await params;

  return <QuizView key={quizId} pathId={pathId} quizId={quizId} />;
}
