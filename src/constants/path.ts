import type { PathCategory, Status } from "@prisma/client";

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
