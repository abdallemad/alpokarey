import type { UserRole } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

import { ConflictError, NotFoundError } from "@/lib/errors";
import {
  userRepository,
  type AppUser,
  type UserDetailRow,
  type UserListRow,
} from "@/repositories/user.repository";
import type { Paginated } from "@/types/api";
import type { UserDetail, UserListItem } from "@/types/user";
import type { UserListQuery } from "@/validation/user.schema";

export type ClerkProfile = {
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
};

/**
 * Emails that should always hold ADMIN, from `ADMIN_EMAILS` in the environment
 * (comma-separated). Keeping this in config rather than in source means adding
 * an administrator does not require a code change and a deploy.
 */
function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowlistedAdmin(email: string): boolean {
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export const userService = {
  /**
   * Reconciles the local `User` row with Clerk on every sign-in.
   *
   * Three cases, in order:
   *
   * 1. **Known `clerkId`** — refresh the profile fields, which would otherwise
   *    drift whenever someone changes their name or email in Clerk.
   * 2. **Known email, new `clerkId`** — the Clerk account was deleted and
   *    re-created. Re-link the existing row instead of inserting a duplicate.
   *    This is the case that previously crashed: `email` is `@unique`, so the
   *    insert failed with P2002 and the callback returned a 500.
   * 3. **Neither** — create the row.
   *
   * Roles are only ever *raised* here. A promotion made by hand (in Prisma
   * Studio, say) must survive the next sign-in, so nothing in this function
   * demotes an existing ADMIN.
   */
  async syncFromClerk(profile: ClerkProfile): Promise<AppUser> {
    const { clerkId, email, name, imageUrl } = profile;

    const byClerkId = await userRepository.findByClerkId(clerkId);

    if (byClerkId) {
      return userRepository.update(byClerkId.id, {
        email,
        name,
        imageUrl,
        role: elevateRole(byClerkId.role, email),
      });
    }

    const byEmail = await userRepository.findByEmail(email);

    if (byEmail) {
      return userRepository.update(byEmail.id, {
        clerkId,
        name,
        imageUrl,
        role: elevateRole(byEmail.role, email),
      });
    }

    // The very first account to sign in bootstraps the console — without it a
    // fresh database has no way to produce an administrator.
    const isFirstUser = (await userRepository.count()) === 0;
    const role: UserRole =
      isFirstUser || isAllowlistedAdmin(email) ? "ADMIN" : "STUDENT";

    return userRepository.create({ clerkId, email, name, imageUrl, role });
  },

  /* ---------------------------------------------------------------------- */
  /*  The users console — /admin/users                                       */
  /* ---------------------------------------------------------------------- */

  async listUsers(query: UserListQuery): Promise<Paginated<UserListItem>> {
    const { page, pageSize } = query;

    const { rows, total } = await userRepository.findMany({
      search: query.search || undefined,
      role: query.role === "all" ? undefined : query.role,
      sort: query.sort,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: rows.map(toListItem),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  /**
   * One account, for the detail panel.
   *
   * `actor` is not a filter — an admin may read any account — it is there so
   * the response can say whether this row is **their own**, which is the one
   * account whose role they may not change. Deciding that here rather than in
   * the component means the button and the endpoint agree by construction.
   */
  async getUser(actor: AppUser, userId: string): Promise<UserDetail> {
    const row = await userRepository.findDetailById(userId);

    if (!row) {
      throw new NotFoundError("الحساب المطلوب غير موجود");
    }

    return toDetail(row, actor);
  },

  /**
   * Promote an account to ADMIN, or return it to STUDENT.
   *
   * **The only write the console makes to a user.** Everything else about an
   * account is mirrored from Clerk on sign-in, and overwriting any of it here
   * would be overwritten back on their next visit.
   *
   * Three refusals, in order:
   *
   * 1. **You cannot change your own role.** An admin who demotes themselves is
   *    locked out of the console that would let them undo it. The UI disables
   *    the control, and this is why it can be trusted to.
   * 2. **The last administrator cannot be demoted.** An academy with no admin
   *    has no way back in short of editing the database by hand — the same
   *    reasoning that makes `syncFromClerk` bootstrap the first account.
   * 3. **A missing account is a 404**, checked before either of the above so a
   *    stale panel gets the honest answer.
   *
   * Setting the role an account already holds is a **no-op**, not an error: two
   * tabs, a double click and a stale cache all end in the same state.
   */
  async updateRole(
    actor: AppUser,
    userId: string,
    role: UserRole,
  ): Promise<UserDetail> {
    const target = await userRepository.findDetailById(userId);

    if (!target) {
      throw new NotFoundError("الحساب المطلوب غير موجود");
    }

    if (target.id === actor.id) {
      throw new ConflictError(
        "لا يمكنك تغيير صلاحية حسابك. اطلب من مشرفٍ آخر القيام بذلك.",
      );
    }

    if (target.role === role) {
      return toDetail(target, actor);
    }

    if (target.role === "ADMIN" && role === "STUDENT") {
      const admins = await userRepository.countByRole("ADMIN");

      if (admins <= 1) {
        throw new ConflictError(
          "لا يمكن تحويل آخر مشرف إلى طالب — يجب أن يبقى للأكاديمية مشرف واحد على الأقل.",
        );
      }
    }

    await userRepository.update(target.id, { role });
    await syncRoleToClerk(target.clerkId, role);

    // Re-read rather than patching the row in memory: the panel renders the
    // result, and one shape from one query cannot disagree with itself.
    const updated = await userRepository.findDetailById(target.id);

    return toDetail(updated ?? target, actor);
  },
};

/* -------------------------------------------------------------------------- */
/*  DTO mapping                                                                */
/* -------------------------------------------------------------------------- */

function toListItem(row: UserListRow): UserListItem {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    imageUrl: row.imageUrl,
    role: row.role,
    enrollmentsCount: row._count.enrollments,
    certificatesCount: row._count.certificates,
    createdAt: row.createdAt.toISOString(),
  };
}

function toDetail(row: UserDetailRow, actor: AppUser): UserDetail {
  return {
    ...toListItem(row),
    updatedAt: row.updatedAt.toISOString(),
    completedLessonsCount: row._count.lessonProgress,
    quizAttemptsCount: row._count.quizAttempts,
    paths: row.enrollments.map((enrollment) => ({
      id: enrollment.path.id,
      title: enrollment.path.title,
      progress: enrollment.progress,
      isCompleted: enrollment.isCompleted,
      enrolledAt: enrollment.createdAt.toISOString(),
    })),
    isAllowlistedAdmin: isAllowlistedAdmin(row.email),
    isSelf: row.id === actor.id,
  };
}

/**
 * Mirror the new role into Clerk's `publicMetadata`.
 *
 * **Best effort, and deliberately not fatal.** The local `User.role` column is
 * the authority — `requireAdmin()` reads it and nothing else — so a failed
 * Clerk write leaves authorisation correct and one convenience stale. Throwing
 * instead would mean a promotion that succeeded in the database reported itself
 * as a failure, and the admin would press the button again on a row that is
 * already correct.
 *
 * What the copy buys: the learner shell reads `publicMetadata.role` to decide
 * whether to show the "لوحة التحكم" shortcut, and the marketing header does the
 * same. Without this write a freshly promoted admin would have to type `/admin`
 * by hand. See `docs/admin-access-control.md` §5.
 */
async function syncRoleToClerk(clerkId: string, role: UserRole): Promise<void> {
  try {
    const client = await clerkClient();

    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: { role },
    });
  } catch (error) {
    console.error("[users] failed to mirror role to Clerk", { clerkId, error });
  }
}

function elevateRole(current: UserRole, email: string): UserRole {
  if (current === "ADMIN") return "ADMIN";
  return isAllowlistedAdmin(email) ? "ADMIN" : current;
}
