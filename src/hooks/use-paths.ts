"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/axios";
import { queryKeys } from "@/constants/query-keys";
import type { Paginated } from "@/types/api";
import type { PathListItem, PathsQueryState } from "@/types/path";

/**
 * A filtered, paginated page of learning paths.
 *
 * `keepPreviousData` keeps the current rows on screen while the next page or a
 * new search loads, so the table never collapses to a skeleton mid-typing.
 */
export function usePaths(query: PathsQueryState) {
  return useQuery({
    queryKey: queryKeys.paths.list(query),
    queryFn: () =>
      apiRequest<Paginated<PathListItem>>({
        url: "/paths",
        method: "GET",
        params: query,
      }),
    placeholderData: keepPreviousData,
  });
}
