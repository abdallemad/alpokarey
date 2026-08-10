import type { Metadata } from "next";
import { Suspense } from "react";

import { NewQuizView } from "@/components/admin/quizzes/new-quiz-view";
import { PageContainer, PageHeaderSkeleton } from "@/components/admin/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "اختبار جديد" };

/**
 * `/admin/quizzes/new`.
 *
 * The view reads `?pathId=`/`?stageId=`/`?lessonId=` with `useSearchParams`,
 * which Next requires to sit under a Suspense boundary.
 */
export default function NewQuizPage() {
  return (
    <PageContainer>
      <Suspense
        fallback={
          <>
            <PageHeaderSkeleton />
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-full max-w-2xl" />
                <Skeleton className="h-24 w-full max-w-2xl" />
                <Skeleton className="h-8 w-40" />
              </CardContent>
            </Card>
          </>
        }
      >
        <NewQuizView />
      </Suspense>
    </PageContainer>
  );
}
