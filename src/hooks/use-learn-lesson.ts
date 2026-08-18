"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { apiRequest } from "@/lib/axios";
import type { LearnLesson } from "@/types/learn";

/**
 * One lesson, as a learner enrolled in the path sees it.
 *
 * Deliberately **not** `useLesson` from `hooks/use-lesson.ts`: that one calls
 * the admin endpoint, which a student gets a 403 from. Two hooks because they
 * are two contracts, not because the data looks similar.
 */
export function useLearnLesson(pathId: string, lessonId: string) {
  return useQuery({
    queryKey: queryKeys.learn.lesson(pathId, lessonId),
    queryFn: () =>
      apiRequest<LearnLesson>({
        url: `/me/learn/${pathId}/lessons/${lessonId}`,
        method: "GET",
      }),
    enabled: Boolean(pathId && lessonId),
  });
}
