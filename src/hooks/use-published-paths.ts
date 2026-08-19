"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { apiRequest } from "@/lib/axios";
import type { PublicPathSummary } from "@/types/path";

/**
 * The published catalog, for the landing page's paths section.
 *
 * Fetched on the client rather than on the server so that `/` stays a
 * **static** route. The rest of the page — the vision, the values, the
 * audiences, the methodology — is the part search engines and first-paint speed
 * care about, and it does not change between visitors; the path list is
 * inventory that does. Rendering the inventory on the client keeps the argument
 * static and lets only the list wait.
 *
 * `staleTime` is generous because it is: an admin publishes a path perhaps
 * weekly, and a visitor who sees a five-minute-old catalog has lost nothing.
 */
export function usePublishedPaths() {
  return useQuery({
    queryKey: queryKeys.paths.published(),
    queryFn: () =>
      apiRequest<PublicPathSummary[]>({
        url: "/paths/published",
        method: "GET",
      }),
    staleTime: 5 * 60 * 1000,
  });
}
