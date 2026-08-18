"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { apiRequest } from "@/lib/axios";
import type { LearnCurriculum } from "@/types/learn";

/**
 * The curriculum of one path, with this learner's progress through it.
 *
 * Fetched once by the player's layout and read by everything inside it: the
 * sidebar renders it, and the prev/next buttons derive their targets from it
 * through `utils/curriculum.ts`. Because the layout does not unmount when a
 * learner moves between lessons, the tree is fetched once per visit to a path
 * rather than once per lesson.
 */
export function useCurriculum(pathId: string) {
  return useQuery({
    queryKey: queryKeys.learn.curriculum(pathId),
    queryFn: () =>
      apiRequest<LearnCurriculum>({
        url: `/me/learn/${pathId}`,
        method: "GET",
      }),
    enabled: Boolean(pathId),
  });
}
