import type { PathCategory, Status } from "@prisma/client";

/**
 * Quiz shapes as they cross the HTTP boundary.
 *
 * Dates are ISO strings, not `Date`: JSON has no date type.
 */

export type QuizPathSummary = {
  id: string;
  title: string;
  status: Status;
  category: PathCategory | null;
};

export type QuizStageSummary = {
  id: string;
  title: string;
  order: number;
  path: QuizPathSummary;
};

export type QuizLinkedLesson = {
  id: string;
  title: string;
};

/**
 * How an exam is attached to the curriculum — the question the list is
 * organised around.
 *
 * It is **derived, not stored**: `Quiz.isFinal` marks a stage's final exam, and
 * `Lesson.quizId` is what makes an exam belong to a lesson. There is no third
 * column, so `UNLINKED` is simply "neither" — an exam that exists but that no
 * student can currently reach.
 */
export type QuizKind = "FINAL" | "LESSON" | "UNLINKED";

export type QuizListItem = {
  id: string;
  title: string;
  description: string | null;
  /** Percentage a student must score to pass. */
  passingScore: number;
  /** Free text as authored — "20 دقيقة" — not a parsed quantity. */
  duration: string | null;
  /** Position within its own stage, as authored by the admin. */
  order: number;
  isFinal: boolean;
  active: boolean;
  kind: QuizKind;
  questionsCount: number;
  attemptsCount: number;
  /**
   * Lessons whose `quizId` points here. The relation is one-to-many, so this
   * is an array even though the editor only ever sets one.
   */
  linkedLessons: QuizLinkedLesson[];
  createdAt: string;
  updatedAt: string;
  stage: QuizStageSummary;
};

export type QuizOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type QuizQuestion = {
  id: string;
  text: string;
  options: QuizOption[];
};

export type QuizDetail = QuizListItem & {
  /** Read-only on this screen — see `docs/quizzes-feature.md` §12. */
  questions: QuizQuestion[];
};

/**
 * The list screen's filter state, mirrored in the URL query string.
 *
 * Declared by hand rather than derived from `quizListQuerySchema` because Zod's
 * `coerce` widens its input to `unknown`, which makes a poor React Query cache
 * key. Same reasoning as the other list screens.
 */
export type QuizzesQueryState = {
  search: string;
  pathId: string;
  stageId: string;
  kind: string;
  active: string;
  status: string;
  sort: string;
  page: number;
  pageSize: number;
};
