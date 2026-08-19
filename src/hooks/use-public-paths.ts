"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { PUBLIC_PATHS_TEASER_LIMIT } from "@/constants/path";
import { queryKeys } from "@/constants/query-keys";
import { apiRequest } from "@/lib/axios";
import type { Paginated } from "@/types/api";
import type { PublicPathSummary, PublicPathsQueryState } from "@/types/path";

/**
 * The published catalog — one filtered, paginated page of it.
 *
 * Fetched on the client rather than on the server so `/paths` stays cheap to
 * render and its filter state can live in the URL without a round trip through
 * a Server Component for every keystroke. The same reasoning the landing page's
 * teaser already used, plus one more: this response is the same for every
 * visitor, so nothing here depends on a session.
 *
 * `keepPreviousData` keeps the current cards on screen while the next page or a
 * new search loads. Without it the grid collapses to skeletons on every
 * keystroke, and the page appears to flicker rather than filter.
 */
export function usePublicPaths(query: PublicPathsQueryState) {
  return useQuery({
    queryKey: queryKeys.paths.publishedList(query),
    queryFn: () =>
      apiRequest<Paginated<PublicPathSummary>>({
        url: "/paths/published",
        method: "GET",
        params: query,
      }),
    placeholderData: keepPreviousData,
  });
}

/**
 * The first few published paths, for the landing page's teaser section.
 *
 * Hits the same endpoint as the catalog with a fixed query, rather than having
 * an endpoint of its own: the teaser *is* the first page of the featured
 * ordering, and two code paths would eventually give two answers to "what is
 * published?".
 *
 * `staleTime` is generous because it is: an admin publishes a path perhaps
 * weekly, and a visitor who sees a five-minute-old catalog has lost nothing.
 * The browsable catalog deliberately does not set one — someone actively
 * filtering expects the list to answer their filter, not a cache.
 */
const TEASER_QUERY: PublicPathsQueryState = {
  search: "",
  category: "all",
  certification: "all",
  sort: "featured",
  page: 1,
  pageSize: PUBLIC_PATHS_TEASER_LIMIT,
};

export function usePublishedPaths() {
  return useQuery({
    queryKey: queryKeys.paths.publishedList(TEASER_QUERY),
    queryFn: () =>
      apiRequest<Paginated<PublicPathSummary>>({
        url: "/paths/published",
        method: "GET",
        params: TEASER_QUERY,
      }),
    staleTime: 5 * 60 * 1000,
  });
}
