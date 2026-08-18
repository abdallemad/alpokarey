import { NotEnrolledError, NotFoundError } from "@/lib/errors";
import { enrollmentRepository } from "@/repositories/enrollment.repository";
import {
  learnRepository,
  type CurriculumRow,
  type LearnLessonRow,
  type LearnQuizRow,
  type QuizSummaryRow,
} from "@/repositories/learn.repository";
import { lessonProgressRepository } from "@/repositories/lesson-progress.repository";
import { quizAttemptRepository } from "@/repositories/quiz-attempt.repository";
import { studentRepository } from "@/repositories/student.repository";
import type { AppUser } from "@/repositories/user.repository";
import type {
  LearnCurriculum,
  LearnLesson,
  LearnQuiz,
  LearnQuizProgress,
  LearnQuizSummary,
  LearnStage,
} from "@/types/learn";
import { toCertificateEligibility } from "@/utils/certificate";
import {
  isPathComplete,
  reconcileProgress,
  toProgressPercent,
} from "@/utils/progress";

/**
 * Business logic for the learning experience — what a student sees inside a
 * path they are enrolled in.
 *
 * Two rules shape everything here:
 *
 * 1. **Enrolment is the gate.** Every entry point resolves the enrolment for
 *    the signed-in user and the path in the URL, and refuses without it. There
 *    is no read in this module that is not behind that check.
 * 2. **An exam a student cannot take is not shown.** `active = false` means an
 *    exam is still being written, and an `UNLINKED` exam is attached to nothing
 *    — both are filtered out here, in one place, so the sidebar, the prev/next
 *    buttons and the runner can never disagree about what exists.
 *
 * Knows nothing about HTTP — no `Request`, no `Response`.
 */

/** How many past attempts the exam screen lists. Enough to see a trend. */
const ATTEMPTS_LIMIT = 10;

/**
 * The one guard the whole feature rests on.
 *
 * Exported because the two write paths — marking a lesson complete, submitting
 * an exam — need exactly the same check, and a second copy of it is how one of
 * them eventually loses it.
 */
export async function requireEnrollment(userId: string, pathId: string) {
  const enrollment = await enrollmentRepository.findByUserAndPath(
    userId,
    pathId,
  );

  if (!enrollment) {
    throw new NotEnrolledError();
  }

  return enrollment;
}

/**
 * An exam as the learner sees it, or `null` when they should not see it.
 *
 * `active` is the publication switch: `docs/quizzes-feature.md` §5 refuses to
 * activate an exam with no questions, so an inactive exam is by definition one
 * a student would open and be unable to answer.
 */
function toQuizSummary(
  row: QuizSummaryRow | null,
  attempts: ReadonlyMap<string, LearnQuizProgress>,
): LearnQuizSummary | null {
  if (!row || !row.active) return null;

  const progress = attempts.get(row.id);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    passingScore: row.passingScore,
    duration: row.duration,
    questionsCount: row._count.questions,
    isFinal: row.isFinal,
    attemptsCount: progress?.attemptsCount ?? 0,
    bestScore: progress?.bestScore ?? null,
    isPassed: progress?.isPassed ?? false,
  };
}

/** Every exam id in a curriculum, so their attempts can be fetched at once. */
function collectQuizIds(row: CurriculumRow): string[] {
  const ids = new Set<string>();

  for (const stage of row.stages) {
    for (const quiz of stage.quizzes) ids.add(quiz.id);
    for (const lesson of stage.lessons) {
      if (lesson.quiz) ids.add(lesson.quiz.id);
    }
  }

  return [...ids];
}

/**
 * Flat attempt rows folded into one verdict per exam.
 *
 * `isPassed` is OR-ed rather than taken from the best score: passing is a thing
 * that happened, and an admin raising `passingScore` afterwards does not undo
 * it. `bestScore` is the highest ever reached, which is what a learner means by
 * "how did I do".
 */
function toQuizProgress(
  rows: { quizId: string; score: number; isPassed: boolean }[],
): Map<string, LearnQuizProgress> {
  const byQuiz = new Map<string, LearnQuizProgress>();

  for (const row of rows) {
    const current = byQuiz.get(row.quizId);

    byQuiz.set(row.quizId, {
      attemptsCount: (current?.attemptsCount ?? 0) + 1,
      bestScore:
        current?.bestScore == null
          ? row.score
          : Math.max(current.bestScore, row.score),
      isPassed: (current?.isPassed ?? false) || row.isPassed,
    });
  }

  return byQuiz;
}

function buildStages(
  row: CurriculumRow,
  completed: ReadonlySet<string>,
  attempts: ReadonlyMap<string, LearnQuizProgress>,
): LearnStage[] {
  return row.stages.map((stage) => {
    const lessons = stage.lessons.map((lesson) => {
      const quiz = toQuizSummary(lesson.quiz, attempts);

      return {
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        type: lesson.type,
        duration: lesson.duration,
        isCompleted: completed.has(lesson.id),
        attachmentsCount: lesson._count.attachments,
        // A final exam belongs to its stage even when a stray `Lesson.quizId`
        // points at it — the same precedence `quizService.toKind()` applies, so
        // the exam is never listed twice with two different meanings.
        quiz: quiz && !quiz.isFinal ? quiz : null,
      };
    });

    const completedLessonsCount = lessons.filter(
      (lesson) => lesson.isCompleted,
    ).length;

    return {
      id: stage.id,
      title: stage.title,
      order: stage.order,
      lessons,
      // A stage may hold only one final — `docs/quizzes-feature.md` §5 refuses
      // the second — so the first row is the whole answer.
      finalQuiz: toQuizSummary(stage.quizzes[0] ?? null, attempts),
      lessonsCount: lessons.length,
      completedLessonsCount,
      // Computed from the lesson rows alone, with no reconciliation against
      // `Enrollment.progress`: a stage has no stored counterpart, and these are
      // the very rows the sidebar puts a tick beside.
      progress: toProgressPercent(completedLessonsCount, lessons.length),
      isCompleted:
        lessons.length > 0 && completedLessonsCount === lessons.length,
    };
  });
}

function toLesson(
  row: LearnLessonRow,
  progress: { isCompleted: boolean; completedAt: Date | null } | null,
  attempts: ReadonlyMap<string, LearnQuizProgress>,
): LearnLesson {
  const quiz = toQuizSummary(row.quiz, attempts);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    contentType: row.contentType,
    videoUrl: row.videoUrl,
    content: row.content,
    duration: row.duration,
    order: row.order,
    isCompleted: progress?.isCompleted ?? false,
    completedAt: progress?.completedAt?.toISOString() ?? null,
    attachments: row.attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachment.type,
      content: attachment.content,
      url: attachment.url,
      createdAt: attachment.createdAt.toISOString(),
    })),
    stage: { id: row.stage.id, title: row.stage.title, order: row.stage.order },
    path: { id: row.stage.path.id, title: row.stage.path.title },
    quiz: quiz && !quiz.isFinal ? quiz : null,
  };
}

function toQuiz(
  row: LearnQuizRow,
  attempts: LearnQuiz["attempts"],
  progress: LearnQuizProgress | undefined,
): LearnQuiz {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    passingScore: row.passingScore,
    duration: row.duration,
    questionsCount: row._count.questions,
    isFinal: row.isFinal,
    attemptsCount: progress?.attemptsCount ?? 0,
    bestScore: progress?.bestScore ?? null,
    isPassed: progress?.isPassed ?? false,
    questions: row.questions.map((question) => ({
      id: question.id,
      text: question.text,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
      })),
    })),
    stage: { id: row.stage.id, title: row.stage.title, order: row.stage.order },
    path: { id: row.stage.path.id, title: row.stage.path.title },
    // `Lesson.quizId` is one-to-many, so the relation is an array even though
    // the editor only ever points one lesson at an exam.
    lesson: row.lessons[0] ?? null,
    attempts,
  };
}

export const learnService = {
  /**
   * The whole curriculum, with this learner's place in it.
   *
   * Four queries, all parallel: the tree, the enrolment, the completed lessons
   * and the attempts. The tree is one query rather than one per stage because
   * the sidebar renders it whole.
   */
  async getCurriculum(user: AppUser, pathId: string): Promise<LearnCurriculum> {
    const [enrollment, row] = await Promise.all([
      enrollmentRepository.findByUserAndPath(user.id, pathId),
      learnRepository.findCurriculum(pathId),
    ]);

    // A missing path is a 404 whether or not the learner is enrolled — telling
    // them to enrol in something that does not exist would be worse.
    if (!row) {
      throw new NotFoundError("المسار المطلوب غير موجود");
    }

    if (!enrollment) {
      throw new NotEnrolledError();
    }

    const lessonIds = row.stages.flatMap((stage) =>
      stage.lessons.map((lesson) => lesson.id),
    );

    const [completedIds, attemptRows, certificates] = await Promise.all([
      lessonProgressRepository.findCompletedIds(user.id, lessonIds),
      quizAttemptRepository.findSummariesForQuizzes(user.id, collectQuizIds(row)),
      // Reuses the learner-scoped certificate read the dashboard already has,
      // rather than adding a per-path endpoint for a single boolean.
      studentRepository.findCertificates(user.id),
    ]);

    const stages = buildStages(
      row,
      new Set(completedIds),
      toQuizProgress(attemptRows),
    );

    const lessonsCount = stages.reduce(
      (total, stage) => total + stage.lessonsCount,
      0,
    );
    const trackedCount = stages.reduce(
      (total, stage) => total + stage.completedLessonsCount,
      0,
    );

    // The same reconciliation `student.service.ts` performs, for the same
    // reason: most enrolments carry a stored percentage that predates
    // per-lesson tracking, and a player reporting 0% for a path the learner's
    // own dashboard calls 67% would be the product contradicting itself.
    //
    // It runs through `utils/progress.ts` rather than inline so that
    // `certificateService` can reach the identical figure — the certificate
    // button is enabled off this number, and the endpoint behind it refuses on
    // that one.
    const { progress, usesStoredProgress } = reconcileProgress(
      toProgressPercent(trackedCount, lessonsCount),
      enrollment.progress,
    );

    const isCompleted = isPathComplete({
      enrollmentIsCompleted: enrollment.isCompleted,
      lessonsCount,
      progress,
    });

    return {
      path: {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        status: row.status,
        certificationActivated: row.certificationActivated,
      },
      stages,
      lessonsCount,
      // Follows whichever record drove `progress`, so "n of m lessons" and the
      // percentage beside it can never contradict each other.
      completedLessonsCount: usesStoredProgress
        ? Math.max(trackedCount, Math.round((progress / 100) * lessonsCount))
        : trackedCount,
      progress,
      progressSource: usesStoredProgress ? "enrollment" : "lessons",
      isCompleted,
      certificate: toCertificateEligibility({
        // The certificate id comes out of the learner-scoped list already
        // fetched above, so the player learns whether to say "claim" or
        // "view" — and where "view" points — without a query of its own.
        certificateId:
          certificates.find((certificate) => certificate.path.id === pathId)
            ?.id ?? null,
        isCertificationActivated: row.certificationActivated,
        lessonsCount,
        isPathCompleted: isCompleted,
      }),
      enrolledAt: enrollment.createdAt.toISOString(),
    };
  },

  /**
   * One lesson, open in the player.
   *
   * `pathId` is not decoration: it is checked against the lesson's own
   * curriculum, so a lesson id from another path cannot be opened by editing
   * the URL of a path the learner *is* enrolled in.
   */
  async getLesson(
    user: AppUser,
    pathId: string,
    lessonId: string,
  ): Promise<LearnLesson> {
    const [enrollment, row] = await Promise.all([
      enrollmentRepository.findByUserAndPath(user.id, pathId),
      learnRepository.findLesson(lessonId),
    ]);

    if (!row || row.stage.path.id !== pathId) {
      throw new NotFoundError("الدرس المطلوب غير موجود في هذا المسار");
    }

    if (!enrollment) {
      throw new NotEnrolledError();
    }

    const [progress, attemptRows] = await Promise.all([
      lessonProgressRepository.findByUserAndLesson(user.id, lessonId),
      quizAttemptRepository.findSummariesForQuizzes(
        user.id,
        row.quiz ? [row.quiz.id] : [],
      ),
    ]);

    return toLesson(row, progress, toQuizProgress(attemptRows));
  },

  /**
   * One exam, ready to be taken.
   *
   * The questions come back through `quizForAttemptSelect`, which has no
   * `isCorrect` field to leak — see `repositories/learn.repository.ts`.
   */
  async getQuiz(
    user: AppUser,
    pathId: string,
    quizId: string,
  ): Promise<LearnQuiz> {
    const [enrollment, row] = await Promise.all([
      enrollmentRepository.findByUserAndPath(user.id, pathId),
      learnRepository.findQuizForAttempt(quizId),
    ]);

    if (!row || row.stage.path.id !== pathId) {
      throw new NotFoundError("الاختبار المطلوب غير موجود في هذا المسار");
    }

    if (!enrollment) {
      throw new NotEnrolledError();
    }

    // An inactive exam is never linked from the curriculum, so reaching one
    // means a stale link or a hand-typed URL. It is genuinely not there yet.
    if (!row.active) {
      throw new NotFoundError("هذا الاختبار غير متاح حاليًا");
    }

    const [attempts, attemptRows] = await Promise.all([
      quizAttemptRepository.findByUserAndQuiz(user.id, quizId, ATTEMPTS_LIMIT),
      // The list above is capped; the counts must not be, or a learner on their
      // eleventh attempt would be told they have made ten.
      quizAttemptRepository.findSummariesForQuizzes(user.id, [quizId]),
    ]);

    return toQuiz(
      row,
      attempts.map((attempt) => ({
        id: attempt.id,
        score: attempt.score,
        isPassed: attempt.isPassed,
        createdAt: attempt.createdAt.toISOString(),
      })),
      toQuizProgress(attemptRows).get(quizId),
    );
  },
};
