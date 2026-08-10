import type { AttachmentType, ContentType, LessonType } from "@prisma/client";

/**
 * Display metadata for the lessons screens.
 *
 * Path enums (status, category) are not repeated here — a lesson row shows its
 * *path's* status, so it reuses the labels in `constants/path.ts` rather than
 * keeping a second translation that can drift.
 */

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  VIDEO: "فيديو",
  TEXT: "نص",
};

export const LESSON_CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  YOUTUBE: "يوتيوب",
  VIDEO: "ملف فيديو",
};

export const ATTACHMENT_TYPE_LABELS: Record<AttachmentType, string> = {
  FILE: "ملف",
  TEXT: "نص",
};

export const LESSON_SORT_LABELS: Record<string, string> = {
  order: "الترتيب داخل المرحلة",
  newest: "الأحدث أولًا",
  oldest: "الأقدم أولًا",
  title: "حسب العنوان",
};

export const LESSONS_PAGE_SIZE = 10;
