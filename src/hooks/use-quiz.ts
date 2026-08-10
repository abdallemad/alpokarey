"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiRequest, type ApiRequestError } from "@/lib/axios";
import { queryKeys } from "@/constants/query-keys";
import { ROUTES } from "@/constants/routes";
import type { QuizDetail } from "@/types/quiz";
import type { QuizCreateInput, QuizUpdateInput } from "@/validation/quiz.schema";

/** A single exam with its questions. */
export function useQuiz(quizId: string) {
  return useQuery({
    queryKey: queryKeys.quizzes.detail(quizId),
    queryFn: () =>
      apiRequest<QuizDetail>({ url: `/quizzes/${quizId}`, method: "GET" }),
    enabled: Boolean(quizId),
  });
}

/**
 * An exam mutation can move `Lesson.quizId`, so the **lessons** cache goes
 * stale too — a lesson row's `hasQuiz` column is exactly that link. Stages and
 * paths carry `quizzesCount`, so they go with it.
 */
function invalidateQuizCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.lessons.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.stages.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.paths.all });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: QuizCreateInput) =>
      apiRequest<QuizDetail>({ url: "/quizzes", method: "POST", data: input }),
    onSuccess: (quiz) => {
      invalidateQuizCaches(queryClient);
      toast.success("تم إنشاء الاختبار بنجاح");
      // Straight to the editor: a new exam has no questions yet, and that is
      // where its remaining work lives.
      router.push(`${ROUTES.admin.quizzes}/${quiz.id}`);
    },
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}

export function useUpdateQuiz(quizId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuizUpdateInput) =>
      apiRequest<QuizDetail>({
        url: `/quizzes/${quizId}`,
        method: "PATCH",
        data: input,
      }),
    onSuccess: (quiz) => {
      // Seed the detail cache with the server's response so the page shows the
      // saved values immediately, then refresh the lists in the background.
      queryClient.setQueryData(queryKeys.quizzes.detail(quizId), quiz);
      invalidateQuizCaches(queryClient);
      toast.success("تم حفظ التعديلات");
    },
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}

/**
 * Deleting from the table should leave the admin where they are, with their
 * filters intact; deleting from the editor has to navigate away. The caller
 * decides via `redirectToList`.
 */
export function useDeleteQuiz({ redirectToList = false } = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (quizId: string) =>
      apiRequest<{ id: string }>({
        url: `/quizzes/${quizId}`,
        method: "DELETE",
      }),
    onSuccess: ({ id }) => {
      queryClient.removeQueries({ queryKey: queryKeys.quizzes.detail(id) });
      invalidateQuizCaches(queryClient);
      toast.success("تم حذف الاختبار");

      if (redirectToList) {
        router.push(ROUTES.admin.quizzes);
      }
    },
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}
