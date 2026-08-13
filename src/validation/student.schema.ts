import { z } from "zod";

import { PATH_CATEGORIES } from "@/validation/path.schema";

/**
 * Query rules for the learner's own endpoints under `/api/me`.
 *
 * Imported by the route handler and by the constants that label these values in
 * Arabic, so a filter the UI can offer is always a filter the API accepts.
 */

/** Where a learner stands in a path — the reconciled progress, not a column. */
export const ENROLLED_PATH_STATES = [
  "all",
  "in-progress",
  "completed",
  "not-started",
] as const;

export const ENROLLED_PATH_SORTS = ["progress", "recent", "title"] as const;

/**
 * `GET /api/me/paths`.
 *
 * No `page`/`pageSize`: this list is bounded by how many paths one person has
 * enrolled in, and paginating it would cost a round trip per screenful of a
 * list that rarely fills one — see `docs/my-paths-feature.md` §5.
 */
export const enrolledPathsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.enum([...PATH_CATEGORIES, "all"]).default("all"),
  state: z.enum(ENROLLED_PATH_STATES).default("all"),
  // Least-finished first by default: the page exists to answer "what do I open
  // now?", and a finished path never is the answer.
  sort: z.enum(ENROLLED_PATH_SORTS).default("progress"),
});

export type EnrolledPathsQuery = z.output<typeof enrolledPathsQuerySchema>;
export type EnrolledPathState = (typeof ENROLLED_PATH_STATES)[number];
export type EnrolledPathSort = (typeof ENROLLED_PATH_SORTS)[number];
