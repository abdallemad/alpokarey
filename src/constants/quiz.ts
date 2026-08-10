import type { QuizKind } from "@/types/quiz";

/**
 * Display metadata for the exams screens.
 *
 * Path enums (status, category) are not repeated here — an exam row shows its
 * *path's* status, so it reuses the labels in `constants/path.ts` rather than
 * keeping a second translation that can drift.
 */

/** How the exam is attached to the curriculum. */
export const QUIZ_KIND_LABELS: Record<QuizKind, string> = {
  FINAL: "اختبار نهائي للمرحلة",
  LESSON: "اختبار درس",
  UNLINKED: "غير مرتبط",
};

/** The same three, shortened for a table cell. */
export const QUIZ_KIND_SHORT_LABELS: Record<QuizKind, string> = {
  FINAL: "نهائي",
  LESSON: "درس",
  UNLINKED: "غير مرتبط",
};

export const QUIZ_KIND_DESCRIPTIONS: Record<QuizKind, string> = {
  FINAL: "يُعقد في نهاية المرحلة، وعليه تُبنى الشهادة.",
  LESSON: "مرتبط بدرس بعينه ويظهر معه.",
  UNLINKED: "غير مرتبط بدرس وليس نهائيًا — لن يصل إليه الطالب.",
};

export const QUIZ_ACTIVE_LABELS: Record<string, string> = {
  true: "مفعّل",
  false: "غير مفعّل",
};

export const QUIZ_SORT_LABELS: Record<string, string> = {
  order: "الترتيب داخل المرحلة",
  newest: "الأحدث أولًا",
  oldest: "الأقدم أولًا",
  title: "حسب العنوان",
};

export const QUIZZES_PAGE_SIZE = 10;
