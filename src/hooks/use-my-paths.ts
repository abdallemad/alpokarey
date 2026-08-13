"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/axios";
import { queryKeys } from "@/constants/query-keys";
import type { EnrolledPathsQueryState, EnrolledPathsResult } from "@/types/student";

/**
 * The signed-in learner's enrolled paths, filtered and sorted by the server.
 *
 * `keepPreviousData` keeps the cards on screen while a new filter loads, so the
 * grid never collapses to a skeleton mid-typing — the same reasoning as the
 * admin path table (`docs/paths-feature.md` §9).
 */
export function useMyPaths(query: EnrolledPathsQueryState) {
  return useQuery({
    queryKey: queryKeys.student.pathsList(query),
    queryFn: () =>
      apiRequest<EnrolledPathsResult>({
        url: "/me/paths",
        method: "GET",
        params: query,
      }),
    placeholderData: keepPreviousData,
  });
}
