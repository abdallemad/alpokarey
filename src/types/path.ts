import type { LessonType, PathCategory, Status } from "@prisma/client";

/**
 * Path shapes as they cross the HTTP boundary.
 *
 * Dates are ISO strings, not `Date` — JSON has no date type, and typing them
 * honestly here stops `.toLocaleDateString()` from blowing up on the client.
 */

export type PathListItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: Status;
  category: PathCategory | null;
  isFeatured: boolean;
  certificationActivated: boolean;
  stagesCount: number;
  enrollmentsCount: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * A published path as an **anonymous visitor** may see it.
 *
 * Deliberately narrower than `PathListItem`. That type carries `status`,
 * `isFeatured` and `enrollmentsCount` — editorial state and business figures
 * that belong to the admin console, not to a public page. Declaring the public
 * shape separately means widening the catalog is a decision someone has to make
 * here, rather than something that happens by reusing a convenient type.
 *
 * See `docs/landing-page.md` §6.
 */
export type PublicPathSummary = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: PathCategory | null;
  certificationActivated: boolean;
  stagesCount: number;
  /** Total lessons across every stage — the honest "size" of a path. */
  lessonsCount: number;
};

/**
 * The catalog's filter state, mirrored in the URL query string.
 *
 * Declared by hand rather than derived from `publicPathsQuerySchema` for the
 * same reason `PathsQueryState` is: Zod's `coerce` widens `page`'s input to
 * `unknown`, which makes a poor React Query cache key.
 */
export type PublicPathsQueryState = {
  search: string;
  category: string;
  certification: string;
  sort: string;
  page: number;
  pageSize: number;
};

export type PathStageSummary = {
  id: string;
  title: string;
  order: number;
  lessonsCount: number;
  quizzesCount: number;
};

/**
 * The list screen's filter state, mirrored in the URL query string.
 *
 * Declared separately from `pathListQuerySchema`'s input type because Zod's
 * `coerce` widens its input to `unknown`, which makes for a poor React Query
 * cache key.
 */
export type PathsQueryState = {
  search: string;
  status: string;
  category: string;
  featured: string;
  sort: string;
  page: number;
  pageSize: number;
};

export type PathDetail = PathListItem & {
  promoUrl: string | null;
  certificatesCount: number;
  /** Total lessons across every stage — the headline "size" of a path. */
  lessonsCount: number;
  stages: PathStageSummary[];
};

/**
 * One lesson as the public path page lists it.
 *
 * A title, its place, and how long it takes — never `content`, `videoUrl` or
 * an attachment. The page has to be readable by someone who has not enrolled,
 * and the whole point of enrolling is that the lesson itself is behind it.
 *
 * `isCompleted` is only ever true for a viewer who *is* enrolled; for everyone
 * else it is `false`, because there is no progress to report.
 */
export type PathOverviewLesson = {
  id: string;
  title: string;
  order: number;
  type: LessonType;
  duration: string | null;
  isCompleted: boolean;
};

export type PathOverviewStage = {
  id: string;
  title: string;
  order: number;
  lessons: PathOverviewLesson[];
  lessonsCount: number;
  /**
   * Active exams only. An inactive exam is one still being written — the
   * player already hides those (`services/learn.service.ts`), and advertising
   * a count the curriculum will not show is the same contradiction from the
   * other side.
   */
  quizzesCount: number;
};

/**
 * Where the person looking at the page stands with this path.
 *
 * Resolved on the server from the session, so the page never has to ask Clerk
 * on the client and then ask the API a second time about the enrolment. An
 * anonymous visitor gets this object too, with every field at its empty value —
 * one shape for both audiences means the UI branches on data rather than on
 * whether a field happens to be there.
 */
export type PathViewerState = {
  isSignedIn: boolean;
  isEnrolled: boolean;
  /** 0–100, reconciled the same way the dashboard and the player reconcile it. */
  progress: number;
  completedLessonsCount: number;
  isCompleted: boolean;
  /**
   * The lesson the "ابدأ" / "تابع" button opens: the first one not yet
   * finished, or simply the first lesson for someone who has not enrolled.
   * `null` only when the path has no lessons at all.
   */
  startLessonId: string | null;
  enrolledAt: string | null;
};

/**
 * `/paths/[pathId]` — one path as the public detail page renders it.
 *
 * Wider than `PublicPathSummary` (it carries the curriculum outline) and
 * narrower than `PathDetail` (no `isFeatured`, no enrolment or certificate
 * totals): this is the *pitch* for a path plus the viewer's own place in it,
 * not the admin's record of it. Keeping it a third type rather than reusing
 * either means widening what a visitor can see stays a decision someone makes
 * here.
 *
 * `status` is present because an enrolled learner may legitimately be looking
 * at a path the admin has since unpublished, and the page says so rather than
 * letting them wonder why the content stopped changing. A **draft they are not
 * enrolled in is a 404** — see `services/path.service.ts`.
 *
 * See `docs/path-detail-feature.md`.
 */
export type PathOverview = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  promoUrl: string | null;
  category: PathCategory | null;
  status: Status;
  certificationActivated: boolean;
  stagesCount: number;
  lessonsCount: number;
  quizzesCount: number;
  stages: PathOverviewStage[];
  viewer: PathViewerState;
};
