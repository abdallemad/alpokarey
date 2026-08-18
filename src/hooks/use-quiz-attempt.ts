"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "@/constants/query-keys";
import { apiRequest, type ApiRequestError } from "@/lib/axios";
import type { QuizAttemptResult } from "@/types/learn";
import type { QuizAttemptSubmitInput } from "@/validation/quiz.schema";

/**
 * Submitting an exam.
 *
 * Not optimistic, and it should not be: the learner is waiting for a verdict
 * only the server can give, and showing a provisional score would be inventing
 * the one number the whole screen exists to report.
 *
 * The graded result is held by the runner as its own state rather than written
 * into a cache — it belongs to this attempt, not to the exam — while the
 * invalidation refreshes the attempt history and the progress figures that now
 * include it.
 */
export function useQuizAttempt(pathId: string, quizId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuizAttemptSubmitInput) =>
      apiRequest<QuizAttemptResult>({
        url: `/quizzes/${quizId}/attempts`,
        method: "POST",
        data: input,
      }),

    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.learn.path(pathId) });
      // `/dashboard` lists the five most recent attempts; one of them is now
      // this.
      queryClient.invalidateQueries({ queryKey: queryKeys.student.all });

      if (result.isPassed) {
        toast.success("اجتزت الاختبار بنجاح");
      } else {
        toast.info("لم تبلغ درجة النجاح هذه المرة. يمكنك إعادة المحاولة.");
      }
    },

    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}
