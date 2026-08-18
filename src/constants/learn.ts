/**
 * Display metadata for the learning experience.
 *
 * The same reason `constants/lesson.ts` and `constants/quiz.ts` exist on the
 * admin side: the database speaks English tokens, the interface speaks Arabic,
 * and that translation happens in exactly one place. Lesson and path enums are
 * not re-translated here — the player imports those labels.
 */

/** The tabs under a lesson's content, in the order they are shown. */
export const LESSON_TAB_VALUES = {
  overview: "overview",
  attachments: "attachments",
} as const;

export const LESSON_TAB_LABELS: Record<string, string> = {
  overview: "الوصف",
  attachments: "المرفقات",
};

/**
 * How many attempts the exam intro lists before it stops.
 *
 * There is no pagination on this list: a learner who has attempted one exam
 * more than a handful of times needs the last few, not an archive.
 */
export const QUIZ_ATTEMPTS_LIMIT = 10;

/** What the runner calls the two kinds of exam. */
export const QUIZ_KIND_LABELS = {
  final: "اختبار المرحلة النهائي",
  lesson: "اختبار الدرس",
} as const;
