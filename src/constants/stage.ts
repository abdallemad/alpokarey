/**
 * Display metadata for the stages screen.
 *
 * Path enums (status, category) are not repeated here — the stage list shows
 * the *parent path's* status and category, so it reuses the labels in
 * `constants/path.ts` rather than keeping a second translation that can drift.
 */

export const STAGE_SORT_LABELS: Record<string, string> = {
  order: "الترتيب داخل المسار",
  newest: "الأحدث أولًا",
  oldest: "الأقدم أولًا",
  title: "حسب العنوان",
};

export const STAGE_CONTENT_LABELS: Record<string, string> = {
  all: "كل المراحل",
  withLessons: "تحتوي دروسًا",
  empty: "بدون دروس",
};

/**
 * Paths per page — **not** stages.
 *
 * The list pages over paths so that a path's stages are never split across a
 * page boundary, which means one page carries however many stages those paths
 * happen to have. Five keeps a typical page around 10–20 rows.
 */
export const STAGES_PAGE_SIZE = 5;
