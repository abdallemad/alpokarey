"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "@/constants/query-keys";
import { apiRequest, type ApiRequestError } from "@/lib/axios";
import type { LearnCurriculum, LearnLesson, LessonProgressResult } from "@/types/learn";
import { withLessonCompletion } from "@/utils/curriculum";

/**
 * Marking a lesson complete — the one write a learner makes while studying.
 *
 * Optimistic, because this is a checkbox: waiting a round trip for a tick to
 * appear makes the whole player feel broken, and the failure case is a single
 * boolean to put back. Both caches the tick appears in are updated — the open
 * lesson and the curriculum tree beside it — then rolled back together if the
 * request fails.
 *
 * `onSettled` invalidates rather than trusting the optimistic value: the server
 * reconciles against `Enrollment.progress`, so the percentage it returns can
 * legitimately be higher than anything computable from the ticks alone.
 */
export function useLessonProgress(pathId: string, lessonId: string) {
  const queryClient = useQueryClient();

  const lessonKey = queryKeys.learn.lesson(pathId, lessonId);
  const curriculumKey = queryKeys.learn.curriculum(pathId);

  return useMutation({
    mutationFn: (isCompleted: boolean) =>
      apiRequest<LessonProgressResult>({
        url: `/lessons/${lessonId}/progress`,
        method: "POST",
        data: { isCompleted },
      }),

    onMutate: async (isCompleted) => {
      // Any in-flight refetch would land after the optimistic write and undo it.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: lessonKey }),
        queryClient.cancelQueries({ queryKey: curriculumKey }),
      ]);

      const previousLesson = queryClient.getQueryData<LearnLesson>(lessonKey);
      const previousCurriculum =
        queryClient.getQueryData<LearnCurriculum>(curriculumKey);

      if (previousLesson) {
        queryClient.setQueryData<LearnLesson>(lessonKey, {
          ...previousLesson,
          isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : null,
        });
      }

      if (previousCurriculum) {
        queryClient.setQueryData<LearnCurriculum>(
          curriculumKey,
          withLessonCompletion(previousCurriculum, lessonId, isCompleted),
        );
      }

      return { previousLesson, previousCurriculum };
    },

    onError: (error: ApiRequestError, _isCompleted, context) => {
      if (context?.previousLesson) {
        queryClient.setQueryData(lessonKey, context.previousLesson);
      }

      if (context?.previousCurriculum) {
        queryClient.setQueryData(curriculumKey, context.previousCurriculum);
      }

      toast.error(error.message);
    },

    onSuccess: (result) => {
      toast.success(
        result.isCompleted
          ? "تم تسجيل إتمام الدرس"
          : "تم التراجع عن إتمام الدرس",
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.learn.path(pathId) });
      // The dashboard and `/paths` both report progress for this path, and the
      // enrolment behind them was just rewritten.
      queryClient.invalidateQueries({ queryKey: queryKeys.student.all });
    },
  });
}
