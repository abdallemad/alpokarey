"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/axios";
import { queryKeys } from "@/constants/query-keys";
import type { Paginated } from "@/types/api";
import type { QuizListItem, QuizzesQueryState } from "@/types/quiz";

/**
 * A filtered, paginated page of exams across every stage.
 *
 * Flat, like the lessons list: each row names its stage and path in columns of
 * its own, and the interesting grouping — final vs lesson-linked — is a filter
 * rather than a heading.
 *
 * `keepPreviousData` keeps the current rows on screen while the next page or a
 * new search loads, so the table never collapses to a skeleton mid-typing.
 */
export function useQuizzes(query: QuizzesQueryState) {
  return useQuery({
    queryKey: queryKeys.quizzes.list(query),
    queryFn: () =>
      apiRequest<Paginated<QuizListItem>>({
        url: "/quizzes",
        method: "GET",
        params: query,
      }),
    placeholderData: keepPreviousData,
  });
}
