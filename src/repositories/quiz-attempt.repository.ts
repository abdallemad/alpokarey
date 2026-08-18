import { db } from "@/lib/db";

/**
 * Data access for `QuizAttempt` and the `QuizAnswer` rows underneath it.
 *
 * The two are always written together — an attempt with no answers is not a
 * record of anything — so there is no `createAnswer` here to call on its own.
 */

export type AttemptAnswerInput = {
  questionId: string;
  optionId: string;
};

export const quizAttemptRepository = {
  /**
   * One attempt and all its answers, atomically.
   *
   * A nested `createMany` under the attempt is a single write: either the
   * attempt and every answer land, or none of them do. Creating the attempt
   * first and looping over the answers afterwards would leave a scored attempt
   * with half its answers behind whenever the second call failed — and the
   * attempt is the row a certificate would eventually rest on.
   */
  create(data: {
    userId: string;
    quizId: string;
    score: number;
    isPassed: boolean;
    answers: AttemptAnswerInput[];
  }) {
    return db.quizAttempt.create({
      data: {
        userId: data.userId,
        quizId: data.quizId,
        score: data.score,
        isPassed: data.isPassed,
        answers: { createMany: { data: data.answers } },
      },
      select: {
        id: true,
        score: true,
        isPassed: true,
        createdAt: true,
      },
    });
  },

  /** This learner's attempts at one exam, newest first. */
  findByUserAndQuiz(userId: string, quizId: string, take: number) {
    return db.quizAttempt.findMany({
      where: { userId, quizId },
      select: { id: true, score: true, isPassed: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  /**
   * Every attempt this learner has made at any of these exams.
   *
   * Returned as flat rows for the Service to fold into per-exam figures, the
   * same trade as `studentRepository.findCompletedLessonIds`: one query and a
   * pass in memory, rather than a query per exam in the curriculum.
   *
   * `isPassed` is read rather than recomputed from `score >= passingScore`,
   * because it records the verdict **at the time of the attempt** — an admin
   * raising the passing score later must not retroactively fail a learner who
   * already passed.
   */
  async findSummariesForQuizzes(userId: string, quizIds: string[]) {
    if (quizIds.length === 0) return [];

    return db.quizAttempt.findMany({
      where: { userId, quizId: { in: quizIds } },
      select: { quizId: true, score: true, isPassed: true },
    });
  },
};
