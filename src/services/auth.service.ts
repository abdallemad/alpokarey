import { auth } from "@clerk/nextjs/server";

import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { userRepository, type AppUser } from "@/repositories/user.repository";

/**
 * Who is making this request, and are they allowed to?
 *
 * Clerk owns the session; the local `User` row owns the role. Both are checked,
 * because a valid Clerk session says nothing about whether that person is an
 * admin of this academy.
 */
export const authService = {
  /** The signed-in user's local record, or `null` when there is no session. */
  async getCurrentUser(): Promise<AppUser | null> {
    const { userId } = await auth();
    if (!userId) return null;

    return userRepository.findByClerkId(userId);
  },

  /**
   * Guard for endpoints that serve the signed-in person their **own** data.
   *
   * Role-blind on purpose: an admin is also a learner, and every consumer of
   * this scopes its queries by the returned `user.id`, so there is no wider
   * data to leak. Throws rather than returning a flag, like `requireAdmin`.
   */
  async requireUser(): Promise<AppUser> {
    const user = await this.getCurrentUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    return user;
  },

  /**
   * Guard for every admin-only endpoint. Throws rather than returning a flag so
   * a route can never forget to check the result.
   */
  async requireAdmin(): Promise<AppUser> {
    const user = await this.getCurrentUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    if (user.role !== "ADMIN") {
      throw new ForbiddenError();
    }

    return user;
  },
};
