import { z } from "zod";

import { PATH_CATEGORIES, PATH_STATUSES } from "@/validation/path.schema";

/**
 * The single source of truth for Stage rules.
 *
 * Imported by `forms/stage-form.tsx` on the client and by `app/api/stages/**`
 * on the server, so the browser and the API can never disagree about what a
 * valid stage looks like. Messages are Arabic because they surface directly
 * under the form fields.
 */

export const stageCreateSchema = z.object({
  // A stage cannot exist without a parent; the form makes this a required
  // select rather than letting the server reject an orphan later.
  pathId: z.uuid("اختر المسار الذي تنتمي إليه المرحلة"),
  title: z
    .string()
    .trim()
    .min(3, "العنوان يجب أن يكون 3 أحرف على الأقل")
    .max(120, "العنوان يجب ألا يتجاوز 120 حرفًا"),
  /**
   * Position inside the path. `""` — an untouched number input — means "put it
   * last", which the Service resolves to `max(order) + 1`. The empty literal
   * comes first so it short-circuits before `coerce` turns `""` into `0`.
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
});

/**
 * A PATCH may carry just the field that changed.
 *
 * `pathId` is deliberately not updatable: moving a stage carries its lessons,
 * its quizzes and every student's progress into a different curriculum, which
 * is a migration rather than an edit.
 */
export const stageUpdateSchema = stageCreateSchema
  .omit({ pathId: true })
  .partial();

/**
 * `order` sorts by the stage's own position inside its path — the sequence a
 * student actually studies it in — and is the default because it is the only
 * ordering that reads correctly under a path heading.
 */
export const STAGE_SORT_OPTIONS = ["order", "newest", "oldest", "title"] as const;

/** Content completeness: a stage with no lessons is an unfinished stage. */
export const STAGE_CONTENT_FILTERS = ["all", "withLessons", "empty"] as const;

export const stageListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  // Either a real path id or the explicit "no filter" token — anything else is
  // a malformed URL rather than an empty result set.
  pathId: z
    .union([z.uuid("معرّف المسار غير صالح"), z.literal("all")])
    .default("all"),
  // `status` and `category` filter the *parent path*: a stage has neither of
  // its own, and "show me the stages of my unpublished fiqh paths" is the
  // question admins actually ask.
  status: z.enum([...PATH_STATUSES, "all"]).default("all"),
  category: z.enum([...PATH_CATEGORIES, "all"]).default("all"),
  content: z.enum(STAGE_CONTENT_FILTERS).default("all"),
  sort: z.enum(STAGE_SORT_OPTIONS).default("order"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type StageCreateInput = z.input<typeof stageCreateSchema>;
export type StageCreateValues = z.output<typeof stageCreateSchema>;
export type StageUpdateInput = z.input<typeof stageUpdateSchema>;
export type StageUpdateValues = z.output<typeof stageUpdateSchema>;
export type StageListQuery = z.output<typeof stageListQuerySchema>;
export type StageSortOption = (typeof STAGE_SORT_OPTIONS)[number];
export type StageContentFilter = (typeof STAGE_CONTENT_FILTERS)[number];
