"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { LessonViewSkeleton } from "@/components/app/learn/learn-skeletons";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useCurriculum } from "@/hooks/use-curriculum";
import { findResumeLesson } from "@/utils/curriculum";

/**
 * `/learn/:pathId` — no lesson named, so pick one.
 *
 * A learner who opens the path itself means "carry on", so this resolves to the
 * first lesson they have not finished, falling back to the very first lesson
 * once everything is done. `replace` rather than `push`: this URL is a
 * signpost, and leaving it in the history would make the back button bounce off
 * it straight back to the lesson.
 *
 * The curriculum is already in the cache — the shell above fetched it — so this
 * is a redirect, not a second wait.
 */
export function LearnEntryView({ pathId }: { pathId: string }) {
  const router = useRouter();
  const { data } = useCurriculum(pathId);

  const resume = data ? findResumeLesson(data.stages) : null;
  const fallback = data?.stages.flatMap((stage) => stage.lessons)[0] ?? null;
  const targetId = resume?.lesson.id ?? fallback?.id ?? null;

  React.useEffect(() => {
    if (targetId) {
      router.replace(ROUTES.app.lesson(pathId, targetId));
    }
  }, [pathId, router, targetId]);

  if (data && !targetId) {
    return (
      <EmptyState
        icon={BookOpen}
        title="لا توجد دروس في هذا المسار بعد"
        description="سيظهر المحتوى هنا فور نشر المشرف لدروس المسار."
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.app.paths} />}
          >
            العودة إلى مساراتي
          </Button>
        }
      />
    );
  }

  return <LessonViewSkeleton />;
}
