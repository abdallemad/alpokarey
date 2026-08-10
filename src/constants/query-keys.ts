import type { LessonsQueryState } from "@/types/lesson";
import type { PathsQueryState } from "@/types/path";
import type { QuizzesQueryState } from "@/types/quiz";
import type { StagesQueryState } from "@/types/stage";

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
  stages: {
    all: ["stages"] as const,
    lists: () => [...queryKeys.stages.all, "list"] as const,
    list: (query: StagesQueryState) =>
      [...queryKeys.stages.lists(), query] as const,
  },
  lessons: {
    all: ["lessons"] as const,
    lists: () => [...queryKeys.lessons.all, "list"] as const,
    list: (query: LessonsQueryState) =>
      [...queryKeys.lessons.lists(), query] as const,
    details: () => [...queryKeys.lessons.all, "detail"] as const,
    detail: (lessonId: string) =>
      [...queryKeys.lessons.details(), lessonId] as const,
  },
  quizzes: {
    all: ["quizzes"] as const,
    lists: () => [...queryKeys.quizzes.all, "list"] as const,
    list: (query: QuizzesQueryState) =>
      [...queryKeys.quizzes.lists(), query] as const,
    details: () => [...queryKeys.quizzes.all, "detail"] as const,
    detail: (quizId: string) =>
      [...queryKeys.quizzes.details(), quizId] as const,
  },
  /** The signed-in learner's own data — never keyed by id, there is only one. */
  student: {
    all: ["student"] as const,
    dashboard: () => [...queryKeys.student.all, "dashboard"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
  },
} as const;
