import { z } from "zod";

/**
 * The single source of truth for Path rules.
 *
 * Imported by `forms/path-form.tsx` on the client and by `app/api/paths/**` on
 * the server, so the browser and the API can never disagree about what a valid
 * path looks like. Messages are Arabic because they surface directly under the
 * form fields.
 */

export const PATH_CATEGORIES = [
  "FIQH",
  "AQEEDA",
  "LIFE_AFFAIRS",
  "SEERAH",
  "TAFSIR",
] as const;

export const PATH_STATUSES = ["DRAFT", "PUBLISHED"] as const;

export const PATH_SORT_OPTIONS = ["newest", "oldest", "title"] as const;

/** Treats an empty form field as "not provided" rather than an invalid value. */
const optionalUrl = z
  .union([z.url("أدخل رابطًا صحيحًا"), z.literal("")])
  .nullish()
  .transform((value) => (value ? value : null));

export const pathCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "العنوان يجب أن يكون 3 أحرف على الأقل")
    .max(120, "العنوان يجب ألا يتجاوز 120 حرفًا"),
  description: z
    .string()
    .trim()
    .max(2000, "الوصف يجب ألا يتجاوز 2000 حرف")
    .nullish()
    .transform((value) => (value ? value : null)),
  // `""` is what an unset `<select>` submits — treat it as "no category"
  // rather than an invalid enum, so the form and the API agree.
  category: z
    .union([z.enum(PATH_CATEGORIES, "اختر تصنيفًا صحيحًا"), z.literal("")])
    .nullish()
    .transform((value) => (value ? value : null)),
  status: z.enum(PATH_STATUSES).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  certificationActivated: z.boolean().default(false),
  imageUrl: optionalUrl,
  promoUrl: optionalUrl,
});

/** Every field optional — a PATCH may carry just the one that changed. */
export const pathUpdateSchema = pathCreateSchema.partial();

/**
 * Query string for the list endpoint. Values arrive as strings, so numbers are
 * coerced and `"all"` is the explicit "no filter" token.
 */
export const pathListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum([...PATH_STATUSES, "all"]).default("all"),
  category: z.enum([...PATH_CATEGORIES, "all"]).default("all"),
  featured: z.enum(["true", "false", "all"]).default("all"),
  sort: z.enum(PATH_SORT_OPTIONS).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type PathCreateInput = z.input<typeof pathCreateSchema>;
export type PathCreateValues = z.output<typeof pathCreateSchema>;
export type PathUpdateInput = z.input<typeof pathUpdateSchema>;
export type PathUpdateValues = z.output<typeof pathUpdateSchema>;
export type PathListQuery = z.output<typeof pathListQuerySchema>;
export type PathListQueryInput = z.input<typeof pathListQuerySchema>;

/**
 * A path id taken from the URL rather than from a body.
 *
 * Used by the two learner-facing path endpoints — the public overview read and
 * the enrolment write — because both are reachable by hand-typed URL, and a
 * malformed id should fail as a 422 that names the problem rather than as a
 * 404 that implies the path was deleted.
 *
 * The admin routes under `/api/paths/[pathId]` do not use it: they are behind
 * `requireAdmin()` and their ids come from links the console itself rendered.
 */
export const pathIdParamSchema = z.object({
  pathId: z.uuid("معرّف المسار غير صالح"),
});
