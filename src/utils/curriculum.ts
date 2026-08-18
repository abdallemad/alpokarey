import type {
  LearnCurriculum,
  LearnLessonSummary,
  LearnQuizSummary,
  LearnStage,
  LearnStep,
} from "@/types/learn";
import { toProgressPercent } from "@/utils/progress";

/**
 * Reading the curriculum as a sequence.
 *
 * The sidebar renders a tree; "previous" and "next" need the same tree as a
 * flat list. Both derive from one array so the button at the bottom of a lesson
 * can never point somewhere other than the row below it in the sidebar.
 *
 * Pure functions over data the Service already shaped and the page already
 * holds — no React, no requests. See `docs/folder-structure.md`.
 */

/**
 * The curriculum top to bottom: each lesson, its own exam immediately after it,
 * and the stage's final exam closing the stage.
 *
 * Exams that a student cannot open are already absent from `stages` — the
 * Service drops inactive ones — so every step here is a real destination.
 */
export function toSteps(stages: LearnStage[]): LearnStep[] {
  const steps: LearnStep[] = [];

  for (const stage of stages) {
    for (const lesson of stage.lessons) {
      steps.push({ kind: "lesson", id: lesson.id, title: lesson.title });

      if (lesson.quiz) {
        steps.push({ kind: "quiz", id: lesson.quiz.id, title: lesson.quiz.title });
      }
    }

    if (stage.finalQuiz) {
      steps.push({
        kind: "quiz",
        id: stage.finalQuiz.id,
        title: stage.finalQuiz.title,
      });
    }
  }

  return steps;
}

/**
 * What sits either side of the open lesson or exam.
 *
 * An unknown id yields two nulls rather than throwing: the curriculum and the
 * open item are two separate requests, so for a moment after an admin deletes
 * something the page can legitimately be showing an item the tree no longer
 * lists.
 */
export function findNeighbours(
  steps: LearnStep[],
  kind: LearnStep["kind"],
  id: string,
): { previous: LearnStep | null; next: LearnStep | null } {
  const index = steps.findIndex((step) => step.kind === kind && step.id === id);

  if (index === -1) return { previous: null, next: null };

  return {
    previous: steps[index - 1] ?? null,
    next: steps[index + 1] ?? null,
  };
}

/** The stage a lesson belongs to, for the "you are here" line above it. */
export function findLessonStage(
  stages: LearnStage[],
  lessonId: string,
): LearnStage | null {
  return (
    stages.find((stage) =>
      stage.lessons.some((lesson) => lesson.id === lessonId),
    ) ?? null
  );
}

/** The stage an exam belongs to, whether it is a lesson's or the stage's final. */
export function findQuizStage(
  stages: LearnStage[],
  quizId: string,
): LearnStage | null {
  return (
    stages.find(
      (stage) =>
        stage.finalQuiz?.id === quizId ||
        stage.lessons.some((lesson) => lesson.quiz?.id === quizId),
    ) ?? null
  );
}

/** The first lesson a learner has not finished — where "continue" points. */
export function findResumeLesson(
  stages: LearnStage[],
): { stage: LearnStage; lesson: LearnLessonSummary } | null {
  for (const stage of stages) {
    for (const lesson of stage.lessons) {
      if (!lesson.isCompleted) return { stage, lesson };
    }
  }

  return null;
}

/**
 * The curriculum with one lesson ticked — or un-ticked — and every count that
 * depends on it brought along.
 *
 * This exists for the optimistic update behind the "mark as complete" button:
 * the tick, the stage counter and the bars all move on the click rather than a
 * round trip later. The server's answer replaces this a moment afterwards.
 *
 * It re-derives counts, it does not invent policy — with one exception noted
 * inline, where the server may legitimately answer higher.
 */
export function withLessonCompletion(
  curriculum: LearnCurriculum,
  lessonId: string,
  isCompleted: boolean,
): LearnCurriculum {
  const stages = curriculum.stages.map((stage) => {
    if (!stage.lessons.some((lesson) => lesson.id === lessonId)) return stage;

    const lessons = stage.lessons.map((lesson) =>
      lesson.id === lessonId ? { ...lesson, isCompleted } : lesson,
    );
    const completedLessonsCount = lessons.filter(
      (lesson) => lesson.isCompleted,
    ).length;

    return {
      ...stage,
      lessons,
      completedLessonsCount,
      progress: toProgressPercent(completedLessonsCount, lessons.length),
      isCompleted:
        lessons.length > 0 && completedLessonsCount === lessons.length,
    };
  });

  const trackedCount = stages.reduce(
    (total, stage) => total + stage.completedLessonsCount,
    0,
  );
  const computed = toProgressPercent(trackedCount, curriculum.lessonsCount);

  return {
    ...curriculum,
    stages,
    completedLessonsCount: Math.max(
      trackedCount,
      // Never below what is already on screen. For an enrolment whose stored
      // percentage runs ahead of its lesson rows, recomputing from the ticks
      // alone would make the bar *drop* at the moment the learner finished
      // something — the one time it must not.
      curriculum.progressSource === "enrollment"
        ? curriculum.completedLessonsCount
        : 0,
    ),
    progress: Math.max(computed, curriculum.progress),
  };
}

/** Every exam in the curriculum, in study order — lesson exams then finals. */
export function toQuizzes(stages: LearnStage[]): LearnQuizSummary[] {
  return toSteps(stages).flatMap((step) => {
    if (step.kind !== "quiz") return [];

    for (const stage of stages) {
      if (stage.finalQuiz?.id === step.id) return [stage.finalQuiz];

      const lesson = stage.lessons.find((item) => item.quiz?.id === step.id);
      if (lesson?.quiz) return [lesson.quiz];
    }

    return [];
  });
}
