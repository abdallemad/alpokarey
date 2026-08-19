"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { queryKeys } from "@/constants/query-keys";
import { ROUTES } from "@/constants/routes";
import { apiRequest, type ApiRequestError } from "@/lib/axios";
import type { EnrollmentResult } from "@/types/enrollment";

/**
 * Enrolling in a path — and going straight into it.
 *
 * **The redirect is the feature.** A learner does not press "التسجيل في
 * المسار" because they want an enrolment row; they press it because they want
 * to start studying. So the mutation ends in the player, at the lesson the
 * server named in its response, rather than back on a page whose only change
 * would be that the button now says something else.
 *
 * Not optimistic, unlike `useLessonProgress`. That one toggles a tick the user
 * can see fail and be put back; this one navigates, and navigating on the
 * strength of a write that has not landed would drop the learner into a player
 * that refuses them — the curriculum behind it is gated on the very row this
 * request creates.
 *
 * `push`, not `replace`: the path page is a real place the learner came from,
 * and the back button should return them to it.
 *
 * Three caches are invalidated because three screens are now wrong:
 *
 * - **`paths.overview(pathId)`** — the page this was pressed on derives its
 *   whole call to action from `viewer`.
 * - **`student.all`** — the dashboard's figures and `/dashboard/paths` both
 *   count enrolments, and there is one more of them now.
 * - **`learn.path(pathId)`** — the player is about to ask for a curriculum it
 *   may hold a cached refusal for, from a visit made before this enrolment
 *   existed.
 */
export function useEnrollInPath(pathId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () =>
      apiRequest<EnrollmentResult>({
        url: `/paths/${pathId}/enroll`,
        method: "POST",
      }),

    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.paths.overview(pathId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.learn.path(pathId) });

      toast.success(
        result.isNew
          ? "تم تسجيلك في المسار. بالتوفيق!"
          : "أنت مسجّل في هذا المسار — نُكمل من حيث توقفت.",
      );

      // A path with no lessons has no destination. `/learn/:pathId` is the one
      // screen that says so properly, so the redirect falls back to it rather
      // than to a lesson URL built from nothing.
      router.push(
        result.startLessonId
          ? ROUTES.app.lesson(pathId, result.startLessonId)
          : ROUTES.app.learn(pathId),
      );
    },

    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}
