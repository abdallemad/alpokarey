"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/axios";
import { queryKeys } from "@/constants/query-keys";
import type { Paginated } from "@/types/api";
import type { LessonListItem, LessonsQueryState } from "@/types/lesson";

/**
 * A filtered, paginated page of lessons across every stage.
 *
 * Flat, unlike the stages list: a lesson row already names its stage and path
 * in dedicated columns, and lessons are numerous enough that a page bounded by
 * rows is more predictable than one bounded by curricula.
 *
 * `keepPreviousData` keeps the current rows on screen while the next page or a
 * new search loads, so the table never collapses to a skeleton mid-typing.
 */
export function useLessons(query: LessonsQueryState) {
  return useQuery({
    queryKey: queryKeys.lessons.list(query),
    queryFn: () =>
      apiRequest<Paginated<LessonListItem>>({
        url: "/lessons",
        method: "GET",
        params: query,
      }),
    placeholderData: keepPreviousData,
  });
}
