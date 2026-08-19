import type { LessonsQueryState } from "@/types/lesson";
import type { PathsQueryState } from "@/types/path";
import type { QuizzesQueryState } from "@/types/quiz";
import type { StagesQueryState } from "@/types/stage";
import type { EnrolledPathsQueryState } from "@/types/student";

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
    /**
     * The public catalog on the landing page.
     *
     * Its own key rather than a `list({ status: "PUBLISHED" })`: it comes from
     * a different endpoint with a different shape, and an admin publishing a
     * path should invalidate `queryKeys.paths.all`, which still catches it.
     */
    published: () => [...queryKeys.paths.all, "published"] as const,
    /**
     * One path as `/paths/:pathId` shows it, viewer state included.
     *
     * Keyed apart from `detail(pathId)` because the two are different
     * documents from different endpoints: `detail` is the admin's record,
     * behind `requireAdmin`, while this one is the public page and carries the
     * signed-in learner's own progress. Sharing a key would let an admin
     * console visit seed the public page's cache with a shape it cannot render.
     *
     * Enrolling invalidates it — the button on that page is derived from
     * `viewer`, and the click has just changed what `viewer` says.
     */
    overview: (pathId: string) =>
      [...queryKeys.paths.all, "overview", pathId] as const,
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
    paths: () => [...queryKeys.student.all, "paths"] as const,
    pathsList: (query: EnrolledPathsQueryState) =>
      [...queryKeys.student.paths(), query] as const,
    /**
     * One issued certificate.
     *
     * Nested under `student` rather than given a top-level entity of its own,
     * because a certificate is only ever read as the signed-in learner's — the
     * endpoint has no form that returns anyone else's. Issuing one invalidates
     * `queryKeys.student.all`, which catches the dashboard's count and the
     * certificates list together.
     */
    certificate: (certificateId: string) =>
      [...queryKeys.student.all, "certificate", certificateId] as const,
  },
  /**
   * The player. Keyed by path so finishing a lesson can refresh one curriculum
   * without touching another, and nested under it so
   * `invalidateQueries({ queryKey: queryKeys.learn.path(pathId) })` catches the
   * tree, the open lesson and the open exam in one call.
   */
  learn: {
    all: ["learn"] as const,
    path: (pathId: string) => [...queryKeys.learn.all, pathId] as const,
    curriculum: (pathId: string) =>
      [...queryKeys.learn.path(pathId), "curriculum"] as const,
    lesson: (pathId: string, lessonId: string) =>
      [...queryKeys.learn.path(pathId), "lesson", lessonId] as const,
    quiz: (pathId: string, quizId: string) =>
      [...queryKeys.learn.path(pathId), "quiz", quizId] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
  },
} as const;
