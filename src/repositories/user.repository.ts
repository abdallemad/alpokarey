import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/** Data access for User. Accounts are mirrored from Clerk on sign-in. */

const userSelect = {
  id: true,
  clerkId: true,
  email: true,
  name: true,
  imageUrl: true,
  role: true,
} satisfies Prisma.UserSelect;

export const userRepository = {
  findByClerkId(clerkId: string) {
    return db.user.findUnique({ where: { clerkId }, select: userSelect });
  },

  /**
   * `email` is unique alongside `clerkId`. Looking up by email is how a
   * re-created Clerk account is matched back to its existing row instead of
   * colliding with it.
   */
  findByEmail(email: string) {
    return db.user.findUnique({ where: { email }, select: userSelect });
  },

  create(data: Prisma.UserUncheckedCreateInput) {
    return db.user.create({ data, select: userSelect });
  },

  update(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return db.user.update({ where: { id }, data, select: userSelect });
  },

  count() {
    return db.user.count();
  },
};

export type AppUser = NonNullable<
  Awaited<ReturnType<typeof userRepository.findByClerkId>>
>;
