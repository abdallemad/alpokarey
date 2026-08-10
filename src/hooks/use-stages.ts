"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/axios";
import { PATH_OPTIONS_LIMIT } from "@/constants/path";
import { queryKeys } from "@/constants/query-keys";
import type { StagesPage, StagesQueryState } from "@/types/stage";

/**
 * A filtered page of stages across every path, grouped by path.
 *
 * The server groups and paginates by path — `data.items` is a list of groups,
 * and `pageSize` counts paths — so a path's stages are never split in two.
 *
 * `keepPreviousData` keeps the current rows on screen while the next page or a
 * new search loads, so the table never collapses to a skeleton mid-typing.
 */
export function useStages(query: StagesQueryState) {
  return useQuery({
    queryKey: queryKeys.stages.list(query),
    queryFn: () =>
      apiRequest<StagesPage>({
        url: "/stages",
        method: "GET",
        params: query,
      }),
    placeholderData: keepPreviousData,
  });
}

export type StageOption = { id: string; title: string; order: number };

function stageOptionsQuery(pathId: string): StagesQueryState {
  return {
    search: "",
    pathId,
    status: "all",
    category: "all",
    content: "all",
    sort: "order",
    page: 1,
    pageSize: PATH_OPTIONS_LIMIT,
  };
}

/**
 * The stages of one path, in study order — the source for a "choose a stage"
 * select.
 *
 * Scoped to a single path on purpose: every stage in the academy would be an
 * unusable list, and a stage is only ever chosen *after* its path is. The
 * query stays disabled until a real path id arrives.
 *
 * It reuses the ordinary list endpoint, whose payload is grouped by path, so
 * `select` flattens the one group back to rows.
 */
export function useStageOptions(pathId: string) {
  const enabled = Boolean(pathId) && pathId !== "all";

  return useQuery({
    queryKey: queryKeys.stages.list(stageOptionsQuery(pathId)),
    queryFn: () =>
      apiRequest<StagesPage>({
        url: "/stages",
        method: "GET",
        params: stageOptionsQuery(pathId),
      }),
    select: (page): StageOption[] =>
      page.items.flatMap((group) =>
        group.stages.map(({ id, title, order }) => ({ id, title, order })),
      ),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
