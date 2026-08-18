import {
  studentRepository,
  type StudentAttemptRow,
  type StudentCertificateRow,
  type StudentEnrollmentRow,
} from "@/repositories/student.repository";
import type { AppUser } from "@/repositories/user.repository";
import type {
  EnrolledPath,
  EnrolledPathsResult,
  NextLesson,
  StudentAttempt,
  StudentCertificate,
  StudentDashboard,
  StudentStats,
} from "@/types/student";
import {
  isPathComplete,
  reconcileProgress,
  toPercent,
  toProgressPercent,
} from "@/utils/progress";
import { toDisplayName } from "@/utils/user";
import type { EnrolledPathsQuery } from "@/validation/student.schema";

/**
 * Business logic for the learner's own dashboard.
 *
 * Knows nothing about HTTP. Everything it returns is derived from the one
 * `userId` it is given — there is no code path here that reads another
 * learner's record.
 */

/** How many past attempts the dashboard shows. Enough to see a trend. */
const RECENT_ATTEMPTS_LIMIT = 5;

function toNextLesson(
  enrollment: StudentEnrollmentRow,
  completed: Set<string>,
): NextLesson | null {
  // Curriculum order, not creation order: "next" means the next one to study.
  for (const stage of enrollment.path.stages) {
    for (const lesson of stage.lessons) {
      if (completed.has(lesson.id)) continue;

      return {
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        stageId: stage.id,
        stageTitle: stage.title,
        stageOrder: stage.order,
      };
    }
  }

  return null;
}

/**
 * One enrolment, with its progress reconciled from both records the database
 * keeps of it.
 *
 * `LessonProgress` is the finer truth — it names the lessons — so it wins
 * whenever it is ahead. `Enrollment.progress` fills the gap for enrolments
 * whose progress was recorded before per-lesson tracking existed, which is the
 * state most rows are in today: reading only the lesson rows told those
 * learners they were at 0% while the column beside them said 67%.
 *
 * The rule is that the learner is never shown less than the database already
 * records for them, and `progressSource` says which record answered.
 */
function toEnrolledPath(
  enrollment: StudentEnrollmentRow,
  completed: Set<string>,
  certificatePathIds: Set<string>,
): EnrolledPath {
  const lessons = enrollment.path.stages.flatMap((stage) => stage.lessons);
  const trackedLessonsCount = lessons.filter((lesson) =>
    completed.has(lesson.id),
  ).length;

  // Shared with the player and the certificate gate through
  // `utils/progress.ts`, so one enrolment cannot be 100% on this card and
  // unfinished at the endpoint that issues its certificate.
  const { progress, usesStoredProgress } = reconcileProgress(
    toProgressPercent(trackedLessonsCount, lessons.length),
    enrollment.progress,
  );

  // With the stored column driving the bar, the "n of m lessons" caption has to
  // follow it — a card reading "0 of 2 lessons · 67%" contradicts itself.
  const completedLessonsCount = usesStoredProgress
    ? Math.max(
        trackedLessonsCount,
        Math.round((progress / 100) * lessons.length),
      )
    : trackedLessonsCount;

  const isCompleted = isPathComplete({
    enrollmentIsCompleted: enrollment.isCompleted,
    lessonsCount: lessons.length,
    progress,
  });

  return {
    id: enrollment.path.id,
    title: enrollment.path.title,
    description: enrollment.path.description,
    imageUrl: enrollment.path.imageUrl,
    category: enrollment.path.category,
    status: enrollment.path.status,
    certificationActivated: enrollment.path.certificationActivated,
    stagesCount: enrollment.path.stages.length,
    lessonsCount: lessons.length,
    completedLessonsCount,
    progress,
    progressSource: usesStoredProgress ? "enrollment" : "lessons",
    isCompleted,
    hasCertificate: certificatePathIds.has(enrollment.path.id),
    // A finished path has no next lesson, even when no `LessonProgress` row
    // exists to prove which ones were done.
    nextLesson: isCompleted ? null : toNextLesson(enrollment, completed),
    enrolledAt: enrollment.createdAt.toISOString(),
  };
}

function toAttempt(row: StudentAttemptRow): StudentAttempt {
  return {
    id: row.id,
    score: row.score,
    isPassed: row.isPassed,
    createdAt: row.createdAt.toISOString(),
    quizId: row.quiz.id,
    quizTitle: row.quiz.title,
    passingScore: row.quiz.passingScore,
    isFinal: row.quiz.isFinal,
    stageTitle: row.quiz.stage.title,
    pathId: row.quiz.stage.path.id,
    pathTitle: row.quiz.stage.path.title,
  };
}

function toCertificate(row: StudentCertificateRow): StudentCertificate {
  return {
    id: row.id,
    issuedAt: row.issuedAt.toISOString(),
    pathId: row.path.id,
    pathTitle: row.path.title,
  };
}

function toStats(paths: EnrolledPath[], certificatesCount: number): StudentStats {
  const totalLessonsCount = paths.reduce(
    (total, path) => total + path.lessonsCount,
    0,
  );
  const completedLessonsCount = paths.reduce(
    (total, path) => total + path.completedLessonsCount,
    0,
  );
  const completedCount = paths.filter((path) => path.isCompleted).length;

  return {
    enrolledCount: paths.length,
    inProgressCount: paths.length - completedCount,
    completedCount,
    certificatesCount,
    completedLessonsCount,
    totalLessonsCount,
    // Averaged over lessons, not over paths: a 2-lesson path and a 60-lesson
    // path should not weigh the same in a single headline figure. Because each
    // path's lesson count already follows its reconciled progress, this figure
    // reflects the stored column wherever that is what the database holds.
    //
    // The fallback covers the one case the weighting cannot: enrolments in
    // paths that have no lessons published yet, where a mean over paths is the
    // only average available.
    overallProgress:
      totalLessonsCount > 0
        ? toPercent((completedLessonsCount / totalLessonsCount) * 100)
        : paths.length === 0
          ? 0
          : toPercent(
              paths.reduce((total, path) => total + path.progress, 0) /
                paths.length,
            ),
  };
}

/**
 * Least-finished first, and finished paths last.
 *
 * Both screens that list enrolments are answering "what should I do now?", and
 * a completed path never is.
 */
function byLeastFinished(a: EnrolledPath, b: EnrolledPath): number {
  if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
  return b.progress - a.progress;
}

/**
 * Every enrolment this learner holds, mapped and reconciled.
 *
 * Shared by the dashboard and `/paths` so the two screens can never report
 * different progress for the same path. The certificate rows come back with it
 * because both callers need them — the dashboard to list them, `/paths` to
 * count them — and re-querying would be a second round trip for a row set that
 * is already in hand.
 */
async function collectEnrolledPaths(userId: string): Promise<{
  paths: EnrolledPath[];
  certificates: StudentCertificateRow[];
}> {
  const [enrollments, completedLessonIds, certificates] = await Promise.all([
    studentRepository.findEnrollments(userId),
    studentRepository.findCompletedLessonIds(userId),
    studentRepository.findCertificates(userId),
  ]);

  const completed = new Set(completedLessonIds);
  const certificatePathIds = new Set(
    certificates.map((certificate) => certificate.path.id),
  );

  const paths = enrollments
    .map((enrollment) =>
      toEnrolledPath(enrollment, completed, certificatePathIds),
    )
    .sort(byLeastFinished);

  return { paths, certificates };
}

/** `state=` — where a learner is in a path, in the words they think in. */
function matchesState(path: EnrolledPath, state: EnrolledPathsQuery["state"]) {
  switch (state) {
    case "completed":
      return path.isCompleted;
    case "in-progress":
      return !path.isCompleted && path.progress > 0;
    case "not-started":
      return !path.isCompleted && path.progress === 0;
    default:
      return true;
  }
}

function matchesSearch(path: EnrolledPath, search: string) {
  const needle = search.trim().toLowerCase();
  if (needle === "") return true;

  return (
    path.title.toLowerCase().includes(needle) ||
    (path.description?.toLowerCase().includes(needle) ?? false)
  );
}

const ENROLLED_PATH_COMPARATORS = {
  progress: byLeastFinished,
  recent: (a: EnrolledPath, b: EnrolledPath) =>
    b.enrolledAt.localeCompare(a.enrolledAt),
  title: (a: EnrolledPath, b: EnrolledPath) => a.title.localeCompare(b.title, "ar"),
} satisfies Record<
  EnrolledPathsQuery["sort"],
  (a: EnrolledPath, b: EnrolledPath) => number
>;

export const studentService = {
  async getDashboard(user: AppUser): Promise<StudentDashboard> {
    const [{ paths, certificates }, attempts] = await Promise.all([
      collectEnrolledPaths(user.id),
      studentRepository.findRecentAttempts(user.id, RECENT_ATTEMPTS_LIMIT),
    ]);

    // "Resume here" is the furthest-along unfinished path — the one with
    // momentum behind it, rather than whichever was enrolled in last.
    const resumeFrom = paths.find(
      (path) => !path.isCompleted && path.nextLesson !== null,
    );

    return {
      displayName: toDisplayName(user),
      stats: toStats(paths, certificates.length),
      paths,
      continueLesson:
        resumeFrom && resumeFrom.nextLesson
          ? {
              ...resumeFrom.nextLesson,
              pathId: resumeFrom.id,
              pathTitle: resumeFrom.title,
            }
          : null,
      recentAttempts: attempts.map(toAttempt),
      certificates: certificates.map(toCertificate),
    };
  },

  /**
   * `/paths` — the learner's enrolments, filtered and sorted.
   *
   * Filtering happens here rather than in SQL because `progress` is not a
   * column: it is reconciled from two records, and `state=in-progress` is a
   * question about the reconciled value. Search and category could be pushed
   * down, but splitting the predicate across two layers would mean a filtered
   * list and its summary disagreed about what "all" meant.
   *
   * The cost is bounded by how many paths one person can enrol in. Should that
   * ever reach the hundreds, `Enrollment.progress` needs to be maintained by a
   * completion endpoint first — then the whole predicate becomes a `where`.
   */
  async getEnrolledPaths(
    user: AppUser,
    query: EnrolledPathsQuery,
  ): Promise<EnrolledPathsResult> {
    const { paths, certificates } = await collectEnrolledPaths(user.id);

    const matching = paths
      .filter(
        (path) =>
          matchesState(path, query.state) &&
          matchesSearch(path, query.search ?? "") &&
          (query.category === "all" || path.category === query.category),
      )
      .sort(ENROLLED_PATH_COMPARATORS[query.sort]);

    return {
      paths: matching,
      // Computed over every enrolment, so the summary describes the learner
      // rather than whatever filter happens to be applied.
      stats: toStats(paths, certificates.length),
      totalEnrolled: paths.length,
    };
  },
};
