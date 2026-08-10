import { z } from "zod";

import { PATH_STATUSES } from "@/validation/path.schema";

/**
 * The single source of truth for Quiz rules.
 *
 * Imported by `forms/quiz-form.tsx` on the client and by `app/api/quizzes/**`
 * on the server, so the browser and the API can never disagree about what a
 * valid exam looks like. Messages are Arabic because they surface directly
 * under the form fields.
 */

/** The three ways an exam can (or cannot) be attached — see `QuizKind`. */
export const QUIZ_KINDS = ["FINAL", "LESSON", "UNLINKED"] as const;

export const QUIZ_SORT_OPTIONS = [
  "order",
  "newest",
  "oldest",
  "title",
] as const;

export const DEFAULT_PASSING_SCORE = 70;

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .nullish()
    .transform((value) => (value ? value : null));

/** An uuid or the empty string an untouched `<select>` submits. */
const optionalId = (message: string) =>
  z
    .union([z.uuid(message), z.literal("")])
    .nullish()
    .transform((value) => (value ? value : null));

export const quizCreateSchema = z.object({
  // An exam cannot exist without a stage — even a lesson-linked one, because
  // the lesson it attaches to lives in a stage too.
  stageId: z.uuid("اختر المرحلة التي ينتمي إليها الاختبار"),
  title: z
    .string()
    .trim()
    .min(3, "العنوان يجب أن يكون 3 أحرف على الأقل")
    .max(120, "العنوان يجب ألا يتجاوز 120 حرفًا"),
  description: optionalText(2000, "الوصف يجب ألا يتجاوز 2000 حرف"),
  passingScore: z.coerce
    .number("أدخل رقمًا صحيحًا")
    .int("درجة النجاح يجب أن تكون رقمًا صحيحًا")
    .min(1, "درجة النجاح تبدأ من 1%")
    .max(100, "درجة النجاح لا تتجاوز 100%")
    .default(DEFAULT_PASSING_SCORE),
  duration: optionalText(30, "المدة يجب ألا تتجاوز 30 حرفًا"),
  /**
   * Position inside the stage. `""` — an untouched number input — means "put
   * it last", which the Service resolves to `max(order) + 1`. The empty
   * literal comes first so it short-circuits before `coerce` turns `""` into
   * `0`. Same rule as stages and lessons.
   */
  order: z
    .union([
      z.literal(""),
      z.coerce
        .number("أدخل رقمًا صحيحًا")
        .int("الترتيب يجب أن يكون رقمًا صحيحًا")
        .min(1, "الترتيب يبدأ من 1")
        .max(999, "الترتيب يجب ألا يتجاوز 999"),
    ])
    .nullish()
    .transform((value) => (value === "" || value == null ? null : value)),
  /** Marks this as the stage's final exam. Mutually exclusive with `lessonId`. */
  isFinal: z.boolean().default(false),
  /** Whether students can see and attempt it. */
  active: z.boolean().default(false),
  /**
   * The lesson to attach this exam to.
   *
   * Not a column on `Quiz` — the link lives on `Lesson.quizId` — but it is
   * part of what an author *decides* about an exam, so it travels with the
   * form and the Service writes it to the other table.
   */
  lessonId: optionalId("معرّف الدرس غير صالح"),
});

/**
 * A PATCH may carry just the field that changed.
 *
 * `stageId` is deliberately not updatable, for the same reason a lesson cannot
 * change its stage: an exam's attempts and its lesson link both belong to the
 * curriculum it sits in.
 */
export const quizUpdateSchema = quizCreateSchema
  .omit({ stageId: true })
  .partial();

export const quizListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  pathId: z
    .union([z.uuid("معرّف المسار غير صالح"), z.literal("all")])
    .default("all"),
  stageId: z
    .union([z.uuid("معرّف المرحلة غير صالح"), z.literal("all")])
    .default("all"),
  kind: z.enum([...QUIZ_KINDS, "all"]).default("all"),
  active: z.enum(["true", "false", "all"]).default("all"),
  // Filters the *parent path's* publication state: an exam has none of its own.
  status: z.enum([...PATH_STATUSES, "all"]).default("all"),
  sort: z.enum(QUIZ_SORT_OPTIONS).default("order"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type QuizCreateInput = z.input<typeof quizCreateSchema>;
export type QuizCreateValues = z.output<typeof quizCreateSchema>;
export type QuizUpdateInput = z.input<typeof quizUpdateSchema>;
export type QuizUpdateValues = z.output<typeof quizUpdateSchema>;
export type QuizListQuery = z.output<typeof quizListQuerySchema>;
export type QuizSortOption = (typeof QUIZ_SORT_OPTIONS)[number];
export type QuizKindFilter = (typeof QUIZ_KINDS)[number];
