"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/axios";
import { PATH_OPTIONS_LIMIT } from "@/constants/path";
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

export type LessonOption = { id: string; title: string; order: number };

function lessonOptionsQuery(stageId: string): LessonsQueryState {
  return {
    search: "",
    pathId: "all",
    stageId,
    type: "all",
    status: "all",
    sort: "order",
    page: 1,
    pageSize: PATH_OPTIONS_LIMIT,
  };
}

/**
 * The lessons of one stage, in study order — the source for the exam editor's
 * "attach to a lesson" select.
 *
 * Scoped to a stage on purpose: an exam may only be linked to a lesson in its
 * own stage (see `quizService`), so offering any other lesson would just build
 * a 409. The query stays disabled until a real stage id arrives.
 */
export function useLessonOptions(stageId: string) {
  const enabled = Boolean(stageId) && stageId !== "all";

  return useQuery({
    queryKey: queryKeys.lessons.list(lessonOptionsQuery(stageId)),
    queryFn: () =>
      apiRequest<Paginated<LessonListItem>>({
        url: "/lessons",
        method: "GET",
        params: lessonOptionsQuery(stageId),
      }),
    select: (page): LessonOption[] =>
      page.items.map(({ id, title, order }) => ({ id, title, order })),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
