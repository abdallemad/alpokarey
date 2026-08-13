import type {
  EnrolledPathSort,
  EnrolledPathState,
} from "@/validation/student.schema";

/**
 * Arabic labels for the learner-facing filters.
 *
 * The same reason `constants/path.ts` exists on the admin side: the database
 * and the query string speak English tokens, the interface speaks Arabic, and
 * that translation should happen in exactly one place.
 */

export const ENROLLED_PATH_STATE_LABELS: Record<EnrolledPathState, string> = {
  all: "كل المسارات",
  "in-progress": "قيد الدراسة",
  completed: "مكتملة",
  "not-started": "لم تبدأ بعد",
};

export const ENROLLED_PATH_SORT_LABELS: Record<EnrolledPathSort, string> = {
  progress: "الأقل إنجازًا أولًا",
  recent: "الأحدث تسجيلًا",
  title: "حسب العنوان",
};

/** The query `/paths` falls back to, and the shape its URL is stripped down to. */
export const ENROLLED_PATHS_DEFAULT_QUERY = {
  search: "",
  category: "all",
  state: "all",
  sort: "progress",
} as const;
