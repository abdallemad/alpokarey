import type { PathsQueryState } from "@/types/path";

/**
 * Every React Query cache key in one place.
 *
 * Keys are hierarchical so a mutation can invalidate a whole entity
 * (`queryKeys.paths.all`) without knowing which filter combinations happen to
 * be cached.
 */
export const queryKeys = {
  paths: {
    all: ["paths"] as const,
    lists: () => [...queryKeys.paths.all, "list"] as const,
    list: (query: PathsQueryState) =>
      [...queryKeys.paths.lists(), query] as const,
    details: () => [...queryKeys.paths.all, "detail"] as const,
    detail: (pathId: string) =>
      [...queryKeys.paths.details(), pathId] as const,
  },
} as const;
