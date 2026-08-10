import type {
  AttachmentType,
  ContentType,
  LessonType,
  PathCategory,
  Status,
} from "@prisma/client";

/**
 * Lesson shapes as they cross the HTTP boundary.
 *
 * A lesson is always "lesson 3 of stage 2 of this path", so every row carries
 * the chain above it — the table shows it, and the editor needs it to explain
 * where the lesson lives.
 *
 * Dates are ISO strings, not `Date`: JSON has no date type.
 */

export type LessonPathSummary = {
  id: string;
  title: string;
  status: Status;
  category: PathCategory | null;
};

export type LessonStageSummary = {
  id: string;
  title: string;
  order: number;
  path: LessonPathSummary;
};

export type LessonListItem = {
  id: string;
  title: string;
  description: string | null;
  type: LessonType;
  contentType: ContentType;
  /** Free text as authored — "12:30", "٤٥ دقيقة" — not a parsed quantity. */
  duration: string | null;
  /** Position within its own stage, as authored by the admin. */
  order: number;
  attachmentsCount: number;
  hasQuiz: boolean;
  createdAt: string;
  updatedAt: string;
  stage: LessonStageSummary;
};

export type LessonAttachment = {
  id: string;
  name: string;
  type: AttachmentType;
  /** Set for `TEXT` attachments — a note, a summary, a transcript. */
  content: string | null;
  /** Set for `FILE` attachments — where the stored object is served from. */
  url: string | null;
  createdAt: string;
};

export type LessonDetail = LessonListItem & {
  videoUrl: string | null;
  content: string | null;
  /** How many students have marked this lesson complete. */
  completionsCount: number;
  attachments: LessonAttachment[];
};

/**
 * The list screen's filter state, mirrored in the URL query string.
 *
 * Declared by hand rather than derived from `lessonListQuerySchema` because
 * Zod's `coerce` widens its input to `unknown`, which makes a poor React Query
 * cache key. Same reasoning as `PathsQueryState` and `StagesQueryState`.
 */
export type LessonsQueryState = {
  search: string;
  pathId: string;
  stageId: string;
  type: string;
  status: string;
  sort: string;
  page: number;
  pageSize: number;
};

/** What a successful upload hands back before it becomes an attachment row. */
export type UploadedFile = {
  /** Storage-driver object key — what `storage.remove()` takes. */
  key: string;
  url: string;
  name: string;
  size: number;
  contentType: string;
};
