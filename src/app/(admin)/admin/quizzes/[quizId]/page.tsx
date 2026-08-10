import type { Metadata } from "next";

import { QuizDetailView } from "@/components/admin/quizzes/quiz-detail-view";
import { PageContainer } from "@/components/admin/shared";

export const metadata: Metadata = { title: "تفاصيل الاختبار" };

/**
 * `/admin/quizzes/[quizId]` — the exam editor.
 *
 * `params` is a Promise in Next 16, so it is awaited before the id is handed
 * to the client view that fetches with it.
 */
export default async function AdminQuizPage({
  params,
}: PageProps<"/admin/quizzes/[quizId]">) {
  const { quizId } = await params;

  return (
    <PageContainer>
      <QuizDetailView quizId={quizId} />
    </PageContainer>
  );
}
