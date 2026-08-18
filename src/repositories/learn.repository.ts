import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Data access for the learning experience — the curriculum as a student reads
 * it, one lesson, and one exam.
 *
 * Separate from `lesson.repository.ts` and `quiz.repository.ts` because the
 * shapes differ where it matters most: **the two exam selects here are what
 * keep the answer key off the student's screen.**
 *
 * - `quizForAttemptSelect` has no `isCorrect` and no `correctAnswer`. It is the
 *   only select the read endpoint uses, so the answers cannot leak into the
 *   page source even by a later refactor adding a field to a shared shape.
 * - `quizForGradingSelect` has both, and is reachable only from the submit
 *   path, which never returns the raw row to a client.
 *
 * The admin's `quizRepository.findById` returns `isCorrect` — which is correct
 * for `/admin/quizzes`, and exactly why the learner side does not reuse it.
 */

/** An exam as the curriculum tree shows it: no questions, just the shape of it. */
const quizSummarySelect = {
  id: true,
  title: true,
  description: true,
  passingScore: true,
  duration: true,
  order: true,
  isFinal: true,
  // Read so the Service can hide inactive exams in one place, rather than
  // half in SQL and half in TypeScript.
  active: true,
  _count: { select: { questions: true } },
} satisfies Prisma.QuizSelect;

const curriculumSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  status: true,
  certificationActivated: true,
  stages: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      lessons: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: {
          id: true,
          title: true,
          order: true,
          type: true,
          duration: true,
          _count: { select: { attachments: true } },
          // The lesson's own exam, through `Lesson.quizId`. A to-one relation
          // takes no `where`, so whether it is active is decided in the Service.
          quiz: { select: quizSummarySelect },
        },
      },
      // Only the stage's final. A `LESSON` exam arrives through the lesson
      // above, and an `UNLINKED` one is unreachable for students by
      // definition — see `docs/quizzes-feature.md` §1.
      quizzes: {
        where: { isFinal: true },
        orderBy: { order: "asc" },
        select: quizSummarySelect,
      },
    },
  },
} satisfies Prisma.PathSelect;

const lessonSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  contentType: true,
  videoUrl: true,
  content: true,
  duration: true,
  order: true,
  stage: {
    select: {
      id: true,
      title: true,
      order: true,
      path: { select: { id: true, title: true } },
    },
  },
  quiz: { select: quizSummarySelect },
  attachments: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      content: true,
      url: true,
      createdAt: true,
    },
  },
} satisfies Prisma.LessonSelect;

/** What a student may load *before* answering. Note what is missing. */
const quizForAttemptSelect = {
  ...quizSummarySelect,
  stage: {
    select: {
      id: true,
      title: true,
      order: true,
      path: { select: { id: true, title: true } },
    },
  },
  lessons: { select: { id: true, title: true }, orderBy: { order: "asc" } },
  questions: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      text: true,
      options: { orderBy: { id: "asc" }, select: { id: true, text: true } },
    },
  },
} satisfies Prisma.QuizSelect;

/** What grading needs. Never returned to a client as-is. */
const quizForGradingSelect = {
  id: true,
  passingScore: true,
  active: true,
  isFinal: true,
  stage: { select: { id: true, path: { select: { id: true } } } },
  questions: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      text: true,
      correctAnswer: true,
      options: {
        orderBy: { id: "asc" },
        select: { id: true, text: true, isCorrect: true },
      },
    },
  },
} satisfies Prisma.QuizSelect;

export type CurriculumRow = Prisma.PathGetPayload<{
  select: typeof curriculumSelect;
}>;
export type CurriculumStageRow = CurriculumRow["stages"][number];
export type CurriculumLessonRow = CurriculumStageRow["lessons"][number];
export type QuizSummaryRow = Prisma.QuizGetPayload<{
  select: typeof quizSummarySelect;
}>;
export type LearnLessonRow = Prisma.LessonGetPayload<{
  select: typeof lessonSelect;
}>;
export type LearnQuizRow = Prisma.QuizGetPayload<{
  select: typeof quizForAttemptSelect;
}>;
export type GradingQuizRow = Prisma.QuizGetPayload<{
  select: typeof quizForGradingSelect;
}>;

export const learnRepository = {
  /**
   * One path with its whole curriculum, in study order.
   *
   * A single query rather than one per stage: the tree is rendered all at once
   * in the sidebar, and a path's curriculum is small enough that fetching it
   * whole costs less than the round trips would.
   */
  findCurriculum(pathId: string) {
    return db.path.findUnique({ where: { id: pathId }, select: curriculumSelect });
  },

  findLesson(lessonId: string) {
    return db.lesson.findUnique({ where: { id: lessonId }, select: lessonSelect });
  },

  /**
   * Which path a lesson belongs to, and nothing else.
   *
   * The completion endpoint is handed a lesson id alone, and it needs the path
   * to check the enrolment. Loading the full lesson — content, attachments —
   * to read one foreign key would move a 20 000-character body across the wire
   * on every checkbox click.
   */
  findLessonPath(lessonId: string) {
    return db.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, title: true, stage: { select: { pathId: true } } },
    });
  },

  /** Every lesson id in a path, for recomputing how far through it a learner is. */
  async findLessonIdsByPath(pathId: string): Promise<string[]> {
    const rows = await db.lesson.findMany({
      where: { stage: { pathId } },
      select: { id: true },
    });

    return rows.map((row) => row.id);
  },

  findQuizForAttempt(quizId: string) {
    return db.quiz.findUnique({
      where: { id: quizId },
      select: quizForAttemptSelect,
    });
  },

  findQuizForGrading(quizId: string) {
    return db.quiz.findUnique({
      where: { id: quizId },
      select: quizForGradingSelect,
    });
  },
};
