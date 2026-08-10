import type { Metadata } from "next";

import { LessonDetailView } from "@/components/admin/lessons/lesson-detail-view";
import { PageContainer } from "@/components/admin/shared";

export const metadata: Metadata = { title: "تفاصيل الدرس" };

/**
 * `/admin/lessons/[lessonId]` — the lesson editor.
 *
 * `params` is a Promise in Next 16, so it is awaited before the id is handed
 * to the client view that fetches with it.
 */
export default async function AdminLessonPage({
  params,
}: PageProps<"/admin/lessons/[lessonId]">) {
  const { lessonId } = await params;

  return (
    <PageContainer>
      <LessonDetailView lessonId={lessonId} />
    </PageContainer>
  );
}
