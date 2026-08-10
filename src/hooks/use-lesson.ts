"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiRequest, type ApiRequestError } from "@/lib/axios";
import { queryKeys } from "@/constants/query-keys";
import { ROUTES } from "@/constants/routes";
import type { LessonDetail } from "@/types/lesson";
import type {
  LessonCreateInput,
  LessonUpdateInput,
} from "@/validation/lesson.schema";

/** A single lesson with its content and attachments. */
export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.lessons.detail(lessonId),
    queryFn: () =>
      apiRequest<LessonDetail>({ url: `/lessons/${lessonId}`, method: "GET" }),
    enabled: Boolean(lessonId),
  });
}

/**
 * Counts of lessons live on two screens above this one — `stagesCount` /
 * `lessonsCount` on a stage row, `lessonsCount` on a path detail — so every
 * lesson mutation invalidates all three caches. Missing this is the classic
 * way a number in one screen drifts from the rows in another.
 */
function invalidateLessonCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.lessons.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.stages.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.paths.all });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: LessonCreateInput) =>
      apiRequest<LessonDetail>({
        url: "/lessons",
        method: "POST",
        data: input,
      }),
    onSuccess: (lesson) => {
      invalidateLessonCaches(queryClient);
      toast.success("تم إنشاء الدرس بنجاح");
      // Straight to the editor: attachments can only be added to a lesson that
      // exists, so creation is only ever half of the job.
      router.push(`${ROUTES.admin.lessons}/${lesson.id}`);
    },
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}

export function useUpdateLesson(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LessonUpdateInput) =>
      apiRequest<LessonDetail>({
        url: `/lessons/${lessonId}`,
        method: "PATCH",
        data: input,
      }),
    onSuccess: (lesson) => {
      // Seed the detail cache with the server's response so the page shows the
      // saved values immediately, then refresh the lists in the background.
      queryClient.setQueryData(queryKeys.lessons.detail(lessonId), lesson);
      invalidateLessonCaches(queryClient);
      toast.success("تم حفظ التعديلات");
    },
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}

/**
 * Deleting from the table should leave the admin where they are, with their
 * filters intact; deleting from the editor has to navigate away, because the
 * record it was showing no longer exists. The caller decides via
 * `redirectToList`.
 */
export function useDeleteLesson({ redirectToList = false } = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (lessonId: string) =>
      apiRequest<{ id: string }>({
        url: `/lessons/${lessonId}`,
        method: "DELETE",
      }),
    onSuccess: ({ id }) => {
      queryClient.removeQueries({ queryKey: queryKeys.lessons.detail(id) });
      invalidateLessonCaches(queryClient);
      toast.success("تم حذف الدرس");

      if (redirectToList) {
        router.push(ROUTES.admin.lessons);
      }
    },
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}
