import type { PathCategory } from "@prisma/client";

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

export type EnrolledPath = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: PathCategory | null;
  certificationActivated: boolean;
  stagesCount: number;
  lessonsCount: number;
  completedLessonsCount: number;
  /**
   * 0–100, **computed** from `LessonProgress` rather than read from
   * `Enrollment.progress` — see `docs/student-dashboard.md` §5.
   */
  progress: number;
  isCompleted: boolean;
  hasCertificate: boolean;
  /** `null` once every lesson is done. */
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
  /** Mean progress across enrolled paths, 0–100. */
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
