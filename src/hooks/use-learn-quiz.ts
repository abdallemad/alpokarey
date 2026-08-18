"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { apiRequest } from "@/lib/axios";
import type { LearnQuiz } from "@/types/learn";

/**
 * One exam, with its questions and this learner's past attempts.
 *
 * `staleTime: Infinity` is not set on purpose: a learner who submits an attempt
 * and comes back should see the new attempt in the list, and the submit
 * mutation invalidates this key to make that happen.
 */
export function useLearnQuiz(pathId: string, quizId: string) {
  return useQuery({
    queryKey: queryKeys.learn.quiz(pathId, quizId),
    queryFn: () =>
      apiRequest<LearnQuiz>({
        url: `/me/learn/${pathId}/quizzes/${quizId}`,
        method: "GET",
      }),
    enabled: Boolean(pathId && quizId),
  });
}
