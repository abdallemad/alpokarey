import type { UserRole } from "@prisma/client";

/**
 * User shapes as they cross the HTTP boundary.
 *
 * Accounts are mirrored from Clerk on sign-in — see
 * `docs/admin-access-control.md` — so nothing here is created by the console.
 * The one thing an admin *does* own is `role`, which is why it is the only
 * writable field in the whole feature.
 *
 * **`clerkId` is deliberately absent.** It is the handle to the account on
 * another service, and no screen needs it; leaving it out means it cannot leak
 * into a page's HTML.
 *
 * Dates are ISO strings, not `Date` — JSON has no date type.
 */

export type UserListItem = {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  role: UserRole;
  /** Stored figures, the same ones the rest of the console reads. */
  enrollmentsCount: number;
  certificatesCount: number;
  createdAt: string;
};

/** One enrolment, as the detail panel lists it. */
export type UserPathSummary = {
  id: string;
  title: string;
  /** `Enrollment.progress` — the stored column, not the reconciled figure. */
  progress: number;
  isCompleted: boolean;
  enrolledAt: string;
};

export type UserDetail = UserListItem & {
  updatedAt: string;
  completedLessonsCount: number;
  quizAttemptsCount: number;
  /** Their most recent enrolments. Capped — see `services/user.service.ts`. */
  paths: UserPathSummary[];
  /**
   * `true` when this address is listed in `ADMIN_EMAILS`.
   *
   * It matters because `syncFromClerk` re-promotes an allowlisted email on
   * every sign-in: demoting such an account holds only until they sign in
   * again. The panel says so rather than letting an admin discover it later.
   */
  isAllowlistedAdmin: boolean;
  /** `true` when this row is the admin who asked. They may not change it. */
  isSelf: boolean;
};

/**
 * The list screen's filter state, mirrored in the URL query string.
 *
 * Declared by hand rather than derived from `userListQuerySchema` for the same
 * reason `PathsQueryState` is: Zod's `coerce` widens `page`'s input to
 * `unknown`, which makes a poor React Query cache key.
 */
export type UsersQueryState = {
  search: string;
  role: string;
  sort: string;
  page: number;
  pageSize: number;
};
