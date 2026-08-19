"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { apiRequest } from "@/lib/axios";
import type { PathOverview } from "@/types/path";

/**
 * One path as its public page shows it, including where the viewer stands.
 *
 * Fetched on the client for the same reason the landing page's catalog is —
 * `hooks/use-published-paths.ts` — with one addition: this response **depends
 * on the session**. The `viewer` object is resolved from the cookie on the
 * server, so a page rendered statically could not carry it, and asking Clerk on
 * the client and then asking the API separately would mean two sources for one
 * answer.
 *
 * No `staleTime`: the catalog can be five minutes old without costing anyone
 * anything, but this page's whole job is a button whose label depends on the
 * enrolment, and the moment that changes the page must not be showing the old
 * one.
 */
export function usePathOverview(pathId: string) {
  return useQuery({
    queryKey: queryKeys.paths.overview(pathId),
    queryFn: () =>
      apiRequest<PathOverview>({
        url: `/paths/${pathId}/overview`,
        method: "GET",
      }),
    enabled: Boolean(pathId),
  });
}
