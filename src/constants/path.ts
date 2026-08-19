import type { PathCategory, Status } from "@prisma/client";

import type { PublicPathsQueryState } from "@/types/path";
import type { PublicPathSort } from "@/validation/path.schema";

/**
 * Display metadata for Path enums.
 *
 * The database stores English enum values; the interface is Arabic. This is the
 * one place that translation happens, so a label never gets retyped by hand in
 * a table cell, a filter, and a form.
 */

export const PATH_CATEGORY_LABELS: Record<PathCategory, string> = {
  FIQH: "الفقه",
  AQEEDA: "العقيدة",
  LIFE_AFFAIRS: "شؤون الحياة",
  SEERAH: "السيرة",
  TAFSIR: "التفسير",
};

/** Category badge colours, from the design system's `--category-*` tokens. */
export const PATH_CATEGORY_CLASSES: Record<PathCategory, string> = {
  FIQH: "bg-category-fiqh/15 text-category-fiqh",
  AQEEDA: "bg-category-aqeeda/15 text-category-aqeeda",
  LIFE_AFFAIRS: "bg-category-life-affairs/15 text-category-life-affairs",
  SEERAH: "bg-category-seerah/15 text-category-seerah",
  TAFSIR: "bg-category-tafsir/15 text-category-tafsir",
};

export const PATH_STATUS_LABELS: Record<Status, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
};

export const PATH_SORT_LABELS: Record<string, string> = {
  newest: "الأحدث أولًا",
  oldest: "الأقدم أولًا",
  title: "حسب العنوان",
};

export const PATHS_PAGE_SIZE = 10;

/**
 * How many paths a "choose a path" filter can offer.
 *
 * Such filters reuse `GET /api/paths`, whose `pageSize` is capped at 100 by
 * `pathListQuerySchema`. Past that many paths the select has to become a
 * searchable combobox backed by its own endpoint.
 */
export const PATH_OPTIONS_LIMIT = 100;

/* -------------------------------------------------------------------------- */
/*  The public catalog                                                         */
/* -------------------------------------------------------------------------- */

/**
 * How many paths the landing page's teaser section shows.
 *
 * A landing page is a pitch, not an index: past six cards a visitor is
 * scrolling a list instead of reading an argument. The full catalog is
 * `/paths`, and the teaser links to it.
 */
export const PUBLIC_PATHS_TEASER_LIMIT = 6;

/** How many cards a page of `/paths` holds — the 3×3 grid at `lg`. */
export const PUBLIC_PATHS_PAGE_SIZE = 9;

export const PUBLIC_PATH_SORT_LABELS: Record<PublicPathSort, string> = {
  featured: "المختارة أولًا",
  newest: "الأحدث إضافةً",
  title: "حسب العنوان",
};

/**
 * The certificate filter, as a tri-state.
 *
 * A query string has no booleans, so `"true"`/`"false"`/`"all"` is the shape
 * the schema accepts — the same one the admin console's `featured` filter uses.
 */
export const PUBLIC_PATH_CERTIFICATION_LABELS: Record<string, string> = {
  all: "بشهادة أو بدونها",
  true: "بشهادة معتمدة",
  false: "بدون شهادة",
};

/** The query `/paths` falls back to, and what its URL is stripped down to. */
export const PUBLIC_PATHS_DEFAULT_QUERY: PublicPathsQueryState = {
  search: "",
  category: "all",
  certification: "all",
  sort: "featured",
  page: 1,
  pageSize: PUBLIC_PATHS_PAGE_SIZE,
};
