"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/axios";
import { PATH_OPTIONS_LIMIT } from "@/constants/path";
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

/** Every path, alphabetically — the source for a "choose a path" filter. */
const PATH_OPTIONS_QUERY: PathsQueryState = {
  search: "",
  status: "all",
  category: "all",
  featured: "all",
  sort: "title",
  page: 1,
  pageSize: PATH_OPTIONS_LIMIT,
};

export type PathOption = { id: string; title: string };

/**
 * The path list reduced to `{ id, title }`, for filter selects.
 *
 * It reuses the ordinary list endpoint rather than adding one of its own, so
 * there is a single place that decides what an admin may read. `select` narrows
 * the payload per observer, which leaves the cache entry shareable with any
 * other caller of the same query.
 */
export function usePathOptions() {
  return useQuery({
    queryKey: queryKeys.paths.list(PATH_OPTIONS_QUERY),
    queryFn: () =>
      apiRequest<Paginated<PathListItem>>({
        url: "/paths",
        method: "GET",
        params: PATH_OPTIONS_QUERY,
      }),
    select: (page): PathOption[] =>
      page.items.map(({ id, title }) => ({ id, title })),
    // The set of paths changes rarely; re-fetching it on every filter change
    // would be pure noise.
    staleTime: 5 * 60 * 1000,
  });
}
