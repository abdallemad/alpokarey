import type { UserRole } from "@prisma/client";

import { userRepository, type AppUser } from "@/repositories/user.repository";

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
};

function elevateRole(current: UserRole, email: string): UserRole {
  if (current === "ADMIN") return "ADMIN";
  return isAllowlistedAdmin(email) ? "ADMIN" : current;
}
