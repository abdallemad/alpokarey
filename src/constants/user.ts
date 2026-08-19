import type { UserRole } from "@prisma/client";

import type { UserSortOption } from "@/validation/user.schema";

/**
 * Display metadata for the users console.
 *
 * The database stores English enum values; the interface is Arabic. This is the
 * one place that translation happens — the same reason `constants/path.ts`
 * exists.
 */

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "مشرف",
  STUDENT: "طالب",
};

/**
 * Role badge colours.
 *
 * `--primary` for ADMIN rather than `--gold`: gold is the achievement token in
 * this design system — certificates, featured paths — and a permission is not
 * an achievement. A student is the ordinary case, so it stays muted.
 */
export const USER_ROLE_CLASSES: Record<UserRole, string> = {
  ADMIN: "bg-primary/10 text-primary",
  STUDENT: "bg-muted text-muted-foreground",
};

export const USER_SORT_LABELS: Record<UserSortOption, string> = {
  newest: "الأحدث انضمامًا",
  oldest: "الأقدم انضمامًا",
  name: "حسب الاسم",
  email: "حسب البريد",
};

export const USERS_PAGE_SIZE = 10;

/**
 * How many of a learner's enrolments the detail panel lists.
 *
 * Enough to see what they are studying without turning a side panel into a
 * second table. The count above it is not capped.
 */
export const USER_PATHS_LIMIT = 8;
