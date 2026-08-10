import { z } from "zod";

import {
  STORAGE_KEY_PATTERN,
  STORAGE_PATH_PATTERN,
} from "@/constants/upload";
import { PATH_STATUSES } from "@/validation/path.schema";

/**
 * The single source of truth for Lesson rules.
 *
 * Imported by `forms/lesson-form.tsx` on the client and by `app/api/lessons/**`
 * on the server, so the browser and the API can never disagree about what a
 * valid lesson looks like. Messages are Arabic because they surface directly
 * under the form fields.
 */

export const LESSON_TYPES = ["VIDEO", "TEXT"] as const;

/** How a VIDEO lesson's `videoUrl` should be played. */
export const LESSON_CONTENT_TYPES = ["YOUTUBE", "VIDEO"] as const;

export const LESSON_SORT_OPTIONS = [
  "order",
  "newest",
  "oldest",
  "title",
] as const;

export const ATTACHMENT_TYPES = ["FILE", "TEXT"] as const;

/** Treats an empty form field as "not provided" rather than an invalid value. */
const optionalUrl = z
  .union([z.url("أدخل رابطًا صحيحًا"), z.literal("")])
  .nullish()
  .transform((value) => (value ? value : null));

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .nullish()
    .transform((value) => (value ? value : null));

/**
 * Where an attachment's file lives — and the two forms that are legitimate.
 *
 * `lib/storage.ts` hands back a **root-relative** path (`/uploads/<key>`),
 * which `z.url()` rejects outright: it wants an absolute URL. Validating an
 * uploaded attachment with `optionalUrl` therefore failed every single file
 * upload with a bare 422 *after* the bytes had already been written to disk.
 *
 * So both forms are accepted: a storage path we produced, or an absolute URL
 * an admin pasted for a file hosted elsewhere. The storage branch is pinned to
 * exactly one path segment, which is what stops `//evil.example` (a
 * protocol-relative URL) and `..` from getting through.
 */
const attachmentUrl = z
  .union([
    z.string().trim().regex(STORAGE_PATH_PATTERN, "مسار الملف غير صالح"),
    z.url("أدخل رابطًا صحيحًا"),
    z.literal(""),
  ])
  .nullish()
  .transform((value) => (value ? value : null));

export const lessonCreateSchema = z.object({
  // A lesson cannot exist without a stage; the form makes this a required
  // select rather than letting the server reject an orphan later.
  stageId: z.uuid("اختر المرحلة التي ينتمي إليها الدرس"),
  title: z
    .string()
    .trim()
    .min(3, "العنوان يجب أن يكون 3 أحرف على الأقل")
    .max(120, "العنوان يجب ألا يتجاوز 120 حرفًا"),
  description: optionalText(2000, "الوصف يجب ألا يتجاوز 2000 حرف"),
  type: z.enum(LESSON_TYPES).default("VIDEO"),
  contentType: z.enum(LESSON_CONTENT_TYPES).default("YOUTUBE"),
  videoUrl: optionalUrl,
  content: optionalText(20000, "المحتوى يجب ألا يتجاوز 20000 حرف"),
  // Free text, because the model stores it as a string and authors write it in
  // whatever form reads best — "12:30" or "٤٥ دقيقة".
  duration: optionalText(30, "المدة يجب ألا تتجاوز 30 حرفًا"),
  /**
   * Position inside the stage. `""` — an untouched number input — means "put
   * it last", which the Service resolves to `max(order) + 1`. The empty
   * literal comes first so it short-circuits before `coerce` turns `""` into
   * `0`. Same rule as `stageCreateSchema`.
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
 * `stageId` is deliberately not updatable, for the same reason a stage cannot
 * change its path: moving a lesson carries its attachments and every student's
 * `LessonProgress` into a different curriculum.
 *
 * Note there is **no** cross-field rule forcing a VIDEO lesson to have a
 * `videoUrl` or a TEXT lesson to have `content`. A lesson under construction is
 * a legitimate state — the same way a path can sit in DRAFT — so the list and
 * the editor *flag* an empty lesson rather than refusing to save it.
 */
export const lessonUpdateSchema = lessonCreateSchema
  .omit({ stageId: true })
  .partial();

export const lessonListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  pathId: z
    .union([z.uuid("معرّف المسار غير صالح"), z.literal("all")])
    .default("all"),
  stageId: z
    .union([z.uuid("معرّف المرحلة غير صالح"), z.literal("all")])
    .default("all"),
  type: z.enum([...LESSON_TYPES, "all"]).default("all"),
  // Filters the *parent path's* publication state: a lesson has none of its own.
  status: z.enum([...PATH_STATUSES, "all"]).default("all"),
  sort: z.enum(LESSON_SORT_OPTIONS).default("order"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Adding an attachment.
 *
 * A `FILE` attachment carries the `url` that `POST /api/uploads` returned plus
 * the storage `key` needed to delete the object later; a `TEXT` attachment
 * carries its body. `superRefine` is what keeps the two halves from being mixed
 * up — the discriminant is `type`, and each branch has different required
 * fields.
 */
export const attachmentCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "أدخل اسمًا للمرفق")
      .max(160, "الاسم يجب ألا يتجاوز 160 حرفًا"),
    type: z.enum(ATTACHMENT_TYPES),
    content: optionalText(20000, "النص يجب ألا يتجاوز 20000 حرف"),
    url: attachmentUrl,
    storageKey: z
      .string()
      .trim()
      .regex(STORAGE_KEY_PATTERN, "مُعرّف الملف غير صالح")
      .max(200)
      .nullish()
      .transform((value) => (value ? value : null)),
  })
  .superRefine((value, ctx) => {
    if (value.type === "FILE" && !value.url) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "ارفع ملفًا أو أدخل رابطًا مباشرًا",
      });
    }

    if (value.type === "TEXT" && !value.content) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "أدخل نص المرفق",
      });
    }
  });

export type LessonCreateInput = z.input<typeof lessonCreateSchema>;
export type LessonCreateValues = z.output<typeof lessonCreateSchema>;
export type LessonUpdateInput = z.input<typeof lessonUpdateSchema>;
export type LessonUpdateValues = z.output<typeof lessonUpdateSchema>;
export type LessonListQuery = z.output<typeof lessonListQuerySchema>;
export type LessonSortOption = (typeof LESSON_SORT_OPTIONS)[number];
export type AttachmentCreateInput = z.input<typeof attachmentCreateSchema>;
export type AttachmentCreateValues = z.output<typeof attachmentCreateSchema>;
