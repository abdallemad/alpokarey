import type { PathCategory, Status } from "@prisma/client";

import type { Paginated } from "@/types/api";

/**
 * Stage shapes as they cross the HTTP boundary.
 *
 * A stage is meaningless on its own — it is always "stage 3 of *this* path" —
 * so every list row carries a summary of its parent. That is what lets the
 * admin table group rows by path without a second request.
 *
 * Dates are ISO strings, not `Date`: JSON has no date type.
 */

export type StagePathSummary = {
  id: string;
  title: string;
  status: Status;
  category: PathCategory | null;
};

export type StageListItem = {
  id: string;
  title: string;
  /** Position within its own path, 1-based, as authored by the admin. */
  order: number;
  lessonsCount: number;
  quizzesCount: number;
  createdAt: string;
  updatedAt: string;
  path: StagePathSummary;
};

/**
 * The list screen's filter state, mirrored in the URL query string.
 *
 * Declared by hand rather than derived from `stageListQuerySchema` because
 * Zod's `coerce` widens its input to `unknown`, which makes a poor React Query
 * cache key. Same reasoning as `PathsQueryState`.
 */
export type StagesQueryState = {
  search: string;
  pathId: string;
  status: string;
  category: string;
  content: string;
  sort: string;
  page: number;
  pageSize: number;
};

/** One path with **all** of its stages that match the current filters. */
export type StageGroup = {
  path: StagePathSummary;
  stages: StageListItem[];
};

/**
 * A page of the stages list.
 *
 * The page unit is the **path**: `items`, `total` and `totalPages` all count
 * paths, so a path's stages are never split across two pages. `totalStages` is
 * carried alongside because the number of stages is what the admin is really
 * counting, and it can no longer be derived from `total`.
 */
export type StagesPage = Paginated<StageGroup> & {
  totalStages: number;
};
