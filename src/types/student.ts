import type { PathCategory, Status } from "@prisma/client";

/**
 * The learner's own view of their learning — what `/dashboard` renders.
 *
 * Everything here is scoped to the signed-in user by construction: the service
 * takes a `userId` and never accepts one from the client.
 *
 * Dates are ISO strings, not `Date`: JSON has no date type.
 */

/** The lesson to open next in a path — the first one not yet completed. */
export type NextLesson = {
  id: string;
  title: string;
  /** Where it sits, so the card can say "المرحلة 2 ▸ الدرس 3". */
  order: number;
  stageId: string;
  stageTitle: string;
  stageOrder: number;
};

/**
 * Which of the two progress records in the database produced `progress`.
 *
 * `"lessons"` — derived from `LessonProgress`, the per-lesson truth.
 * `"enrollment"` — read from `Enrollment.progress`, because the stored column
 * is ahead of what the lesson rows can account for.
 *
 * See `docs/student-dashboard.md` §5.
 */
export type ProgressSource = "lessons" | "enrollment";

export type EnrolledPath = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: PathCategory | null;
  /** A learner can hold an enrolment in a path the admin has not published. */
  status: Status;
  certificationActivated: boolean;
  stagesCount: number;
  lessonsCount: number;
  /** Lessons behind `progress` — see `progressSource` for where it came from. */
  completedLessonsCount: number;
  /**
   * 0–100. Reconciled from **both** `LessonProgress` and `Enrollment.progress`
   * so the card never reports less than the database already records — see
   * `docs/student-dashboard.md` §5.
   */
  progress: number;
  progressSource: ProgressSource;
  isCompleted: boolean;
  hasCertificate: boolean;
  /** `null` once the path is finished. */
  nextLesson: NextLesson | null;
  enrolledAt: string;
};

export type StudentStats = {
  enrolledCount: number;
  inProgressCount: number;
  completedCount: number;
  certificatesCount: number;
  /** Lessons finished across every enrolled path. */
  completedLessonsCount: number;
  totalLessonsCount: number;
  /** Progress across every enrolled path, weighted by lesson count, 0–100. */
  overallProgress: number;
};

export type StudentAttempt = {
  id: string;
  score: number;
  isPassed: boolean;
  createdAt: string;
  quizId: string;
  quizTitle: string;
  passingScore: number;
  isFinal: boolean;
  stageTitle: string;
  pathId: string;
  pathTitle: string;
};

export type StudentCertificate = {
  id: string;
  issuedAt: string;
  pathId: string;
  pathTitle: string;
};

export type StudentDashboard = {
  /** Display name for the greeting — falls back to the email's local part. */
  displayName: string;
  stats: StudentStats;
  /** Enrolled paths, least-finished first: what to work on is what matters. */
  paths: EnrolledPath[];
  /** The single best "resume here" target across every path. */
  continueLesson: (NextLesson & { pathId: string; pathTitle: string }) | null;
  recentAttempts: StudentAttempt[];
  certificates: StudentCertificate[];
};

/**
 * `/paths` — the learner's own enrolled paths.
 *
 * Declared by hand rather than derived from the Zod schema: every field is a
 * plain string so the object makes a stable React Query cache key, which
 * `z.input<>` cannot guarantee (see `docs/paths-feature.md` §4).
 */
export type EnrolledPathsQueryState = {
  search: string;
  /** A `PathCategory`, or `"all"`. */
  category: string;
  /** `"all" | "in-progress" | "completed" | "not-started"`. */
  state: string;
  /** `"progress" | "recent" | "title"`. */
  sort: string;
};

export type EnrolledPathsResult = {
  /** The paths matching the query, already sorted. */
  paths: EnrolledPath[];
  /**
   * Figures over **every** enrolment, not just the matching ones — a summary
   * that shifted while filtering would be describing the filter, not the
   * learner.
   */
  stats: StudentStats;
  /** How many enrolments exist in total, so the UI can tell "no enrolments
   * yet" apart from "no matches for this filter". */
  totalEnrolled: number;
};
