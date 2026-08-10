import {
  studentRepository,
  type StudentAttemptRow,
  type StudentCertificateRow,
  type StudentEnrollmentRow,
} from "@/repositories/student.repository";
import type { AppUser } from "@/repositories/user.repository";
import type {
  EnrolledPath,
  NextLesson,
  StudentAttempt,
  StudentCertificate,
  StudentDashboard,
  StudentStats,
} from "@/types/student";

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

function toEnrolledPath(
  enrollment: StudentEnrollmentRow,
  completed: Set<string>,
  certificatePathIds: Set<string>,
): EnrolledPath {
  const lessons = enrollment.path.stages.flatMap((stage) => stage.lessons);
  const completedLessonsCount = lessons.filter((lesson) =>
    completed.has(lesson.id),
  ).length;

  // A path with no lessons yet is 0%, not 100%. Dividing by zero would
  // otherwise congratulate a learner for finishing an empty curriculum.
  const progress =
    lessons.length === 0
      ? 0
      : Math.round((completedLessonsCount / lessons.length) * 100);

  return {
    id: enrollment.path.id,
    title: enrollment.path.title,
    description: enrollment.path.description,
    imageUrl: enrollment.path.imageUrl,
    category: enrollment.path.category,
    certificationActivated: enrollment.path.certificationActivated,
    stagesCount: enrollment.path.stages.length,
    lessonsCount: lessons.length,
    completedLessonsCount,
    progress,
    isCompleted: lessons.length > 0 && completedLessonsCount === lessons.length,
    hasCertificate: certificatePathIds.has(enrollment.path.id),
    nextLesson: toNextLesson(enrollment, completed),
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
    // path should not weigh the same in a single headline figure.
    overallProgress:
      totalLessonsCount === 0
        ? 0
        : Math.round((completedLessonsCount / totalLessonsCount) * 100),
  };
}

/** The email's local part, for accounts Clerk has no name for. */
function toDisplayName(user: AppUser): string {
  return user.name?.trim() || user.email.split("@")[0];
}

export const studentService = {
  async getDashboard(user: AppUser): Promise<StudentDashboard> {
    const [enrollments, completedLessonIds, attempts, certificates] =
      await Promise.all([
        studentRepository.findEnrollments(user.id),
        studentRepository.findCompletedLessonIds(user.id),
        studentRepository.findRecentAttempts(user.id, RECENT_ATTEMPTS_LIMIT),
        studentRepository.findCertificates(user.id),
      ]);

    const completed = new Set(completedLessonIds);
    const certificatePathIds = new Set(
      certificates.map((certificate) => certificate.path.id),
    );

    const paths = enrollments
      .map((enrollment) =>
        toEnrolledPath(enrollment, completed, certificatePathIds),
      )
      // Least-finished first, and finished paths last: the dashboard's job is
      // to answer "what should I do now?", and a completed path never is.
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return b.progress - a.progress;
      });

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
};
