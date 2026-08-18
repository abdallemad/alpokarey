import type {
  ContentType,
  LessonType,
  PathCategory,
  Status,
} from "@prisma/client";

import type { CertificateEligibility } from "@/types/certificate";
import type { LessonAttachment } from "@/types/lesson";
import type { ProgressSource } from "@/types/student";

/**
 * The learning experience — what `/learn/[pathId]/…` renders.
 *
 * Everything here is the **learner's** view of the curriculum, which is a
 * different shape from the admin's: it carries the learner's own progress on
 * every row, and it deliberately omits anything a student must not see. The
 * clearest example is `LearnQuestionOption`, which has no `isCorrect` — the
 * admin's `QuizOption` does, and shipping that shape to a student would put the
 * answer key in the page source.
 *
 * Dates are ISO strings, not `Date`: JSON has no date type.
 */

/** Where the learner stands with one exam, across all their attempts. */
export type LearnQuizProgress = {
  attemptsCount: number;
  /** Highest score of any attempt, or `null` when never attempted. */
  bestScore: number | null;
  /** Whether any attempt reached `passingScore`. */
  isPassed: boolean;
};

/**
 * An exam as it appears in the curriculum tree and above the runner.
 *
 * No questions — those cost a second query and are only needed once the learner
 * actually opens the exam.
 */
export type LearnQuizSummary = LearnQuizProgress & {
  id: string;
  title: string;
  description: string | null;
  /** Percentage needed to pass. */
  passingScore: number;
  /** Free text as authored — "20 دقيقة" — not a parsed quantity. */
  duration: string | null;
  questionsCount: number;
  /** `true` for the stage's closing exam, which the sidebar sets apart. */
  isFinal: boolean;
};

export type LearnLessonSummary = {
  id: string;
  title: string;
  order: number;
  type: LessonType;
  duration: string | null;
  isCompleted: boolean;
  attachmentsCount: number;
  /**
   * The exam attached to *this lesson*, if any — `Lesson.quizId`.
   *
   * It is nested rather than listed beside the lesson because that is what it
   * is: a test of the lesson above it. The sidebar groups the two together.
   */
  quiz: LearnQuizSummary | null;
};

export type LearnStage = {
  id: string;
  title: string;
  order: number;
  lessons: LearnLessonSummary[];
  /**
   * The stage's final exam — `Quiz.isFinal`. Separate from the lessons because
   * it belongs to the whole stage, not to any one of them, and because it is
   * the exam a certificate would rest on.
   */
  finalQuiz: LearnQuizSummary | null;
  lessonsCount: number;
  completedLessonsCount: number;
  /** 0–100, over this stage's lessons only. */
  progress: number;
  isCompleted: boolean;
};

export type LearnPathSummary = {
  id: string;
  title: string;
  description: string | null;
  category: PathCategory | null;
  /** A learner keeps their enrolment when an admin unpublishes the path. */
  status: Status;
  certificationActivated: boolean;
};

/** The whole tree the sidebar renders, plus the learner's place in it. */
export type LearnCurriculum = {
  path: LearnPathSummary;
  stages: LearnStage[];
  lessonsCount: number;
  completedLessonsCount: number;
  /**
   * 0–100, reconciled from **both** `LessonProgress` and `Enrollment.progress`
   * exactly as `/dashboard` and `/paths` do, so one path never reports three
   * different percentages on three screens. `progressSource` says which record
   * answered — see `docs/learning-feature.md` §6.
   */
  progress: number;
  progressSource: ProgressSource;
  isCompleted: boolean;
  /**
   * Whether this learner may claim the path's certificate, and why not.
   *
   * Computed by the Service and shipped with the curriculum rather than asked
   * for separately, because the button that reads it lives in the player's
   * header — it is on screen for every lesson, and a second request per path
   * to decide whether one button is disabled would be a request per path for
   * nothing. See `docs/certificates-feature.md`.
   */
  certificate: CertificateEligibility;
  enrolledAt: string;
};

/**
 * A neighbour in the study sequence — what the prev/next buttons point at.
 *
 * The sequence is the curriculum read top to bottom: each lesson, its own exam
 * right after it, and the stage's final exam at the end of the stage. That is
 * the order the sidebar shows, so "next" always means the row below.
 *
 * Derived on the client by `utils/curriculum.ts` from the curriculum the
 * sidebar already holds, rather than shipped on every lesson: the tree is
 * cached per path, so asking the server again for a position inside data the
 * page is already rendering would be a query per lesson opened.
 */
export type LearnStep = {
  kind: "lesson" | "quiz";
  id: string;
  title: string;
};

export type LearnStageSummary = {
  id: string;
  title: string;
  order: number;
};

/** One lesson, open in the player. */
export type LearnLesson = {
  id: string;
  title: string;
  description: string | null;
  type: LessonType;
  /** How `videoUrl` should be played — an embed or a file. */
  contentType: ContentType;
  videoUrl: string | null;
  content: string | null;
  duration: string | null;
  order: number;
  isCompleted: boolean;
  completedAt: string | null;
  attachments: LessonAttachment[];
  stage: LearnStageSummary;
  path: { id: string; title: string };
  /** This lesson's own exam, offered at the end of the lesson. */
  quiz: LearnQuizSummary | null;
};

/**
 * An option as a student may see it.
 *
 * `isCorrect` is absent by construction, not by omission — see the note at the
 * top of this file.
 */
export type LearnQuestionOption = {
  id: string;
  text: string;
};

export type LearnQuestion = {
  id: string;
  text: string;
  options: LearnQuestionOption[];
};

export type LearnAttemptSummary = {
  id: string;
  score: number;
  isPassed: boolean;
  createdAt: string;
};

/** One exam, open in the runner. */
export type LearnQuiz = LearnQuizSummary & {
  questions: LearnQuestion[];
  stage: LearnStageSummary;
  path: { id: string; title: string };
  /** Set when this is a lesson's exam — the lesson it tests. */
  lesson: { id: string; title: string } | null;
  /** The most recent attempts, newest first. */
  attempts: LearnAttemptSummary[];
};

/**
 * One graded question, returned **after** submitting.
 *
 * This is the only place the correct answer crosses the wire, and it only ever
 * describes an attempt the learner has already committed to.
 */
export type QuizAnswerReview = {
  questionId: string;
  questionText: string;
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  correctOptionId: string | null;
  correctOptionText: string | null;
  isCorrect: boolean;
};

export type QuizAttemptResult = {
  id: string;
  /** 0–100. */
  score: number;
  isPassed: boolean;
  passingScore: number;
  correctCount: number;
  questionsCount: number;
  createdAt: string;
  review: QuizAnswerReview[];
};

/**
 * What marking a lesson complete hands back.
 *
 * The recomputed path figures ride along so the player can show the new
 * percentage without a second round trip — and so the caller can see that
 * `Enrollment.progress` was updated, which is the whole point of the endpoint.
 */
export type LessonProgressResult = {
  lessonId: string;
  isCompleted: boolean;
  completedAt: string | null;
  pathId: string;
  /** 0–100, recomputed over the path's lessons. */
  pathProgress: number;
  pathIsCompleted: boolean;
  completedLessonsCount: number;
  lessonsCount: number;
};
