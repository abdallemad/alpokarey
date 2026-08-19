import { Prisma, type UserRole } from "@prisma/client";

import { db } from "@/lib/db";
import { USER_PATHS_LIMIT } from "@/constants/user";

/** Data access for User. Accounts are mirrored from Clerk on sign-in. */

const userSelect = {
  id: true,
  clerkId: true,
  email: true,
  name: true,
  imageUrl: true,
  role: true,
} satisfies Prisma.UserSelect;

export type UserSortOption = "newest" | "oldest" | "name" | "email";

export type UserListOptions = {
  search?: string;
  role?: UserRole;
  sort: UserSortOption;
  skip: number;
  take: number;
};

/**
 * A row in the users table.
 *
 * No `clerkId`: the console never needs the handle to the account on Clerk,
 * and a field that is not selected cannot be leaked by a later refactor of the
 * DTO above it.
 */
const listSelect = {
  id: true,
  email: true,
  name: true,
  imageUrl: true,
  role: true,
  createdAt: true,
  _count: { select: { enrollments: true, certificates: true } },
} satisfies Prisma.UserSelect;

/**
 * One account as the detail panel shows it.
 *
 * The counts are **stored figures** — `_count` over the relations — which is
 * what the rest of the console reads too. The learner's own dashboard
 * reconciles `Enrollment.progress` against `LessonProgress` before showing a
 * percentage (`docs/student-dashboard.md` §5); this panel deliberately does
 * not, because an admin looking at an account should see what the database
 * holds rather than a figure derived for a different audience.
 *
 * `lessonProgress` is counted with a `where`, so "completed lessons" means
 * completed ones rather than every row ever written.
 */
const detailSelect = {
  ...listSelect,
  // The one place `clerkId` is read back: promoting an account mirrors the new
  // role into Clerk's `publicMetadata`, and that call is addressed by Clerk id.
  // It stays server-side — `toDetail` does not put it on the DTO.
  clerkId: true,
  updatedAt: true,
  _count: {
    select: {
      enrollments: true,
      certificates: true,
      quizAttempts: true,
      lessonProgress: { where: { isCompleted: true } },
    },
  },
  enrollments: {
    orderBy: { createdAt: "desc" },
    take: USER_PATHS_LIMIT,
    select: {
      progress: true,
      isCompleted: true,
      createdAt: true,
      path: { select: { id: true, title: true } },
    },
  },
} satisfies Prisma.UserSelect;

export type UserListRow = Prisma.UserGetPayload<{ select: typeof listSelect }>;
export type UserDetailRow = Prisma.UserGetPayload<{
  select: typeof detailSelect;
}>;

function buildWhere(
  filters: Pick<UserListOptions, "search" | "role">,
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  // Name or email, because an admin looking for someone has one of the two and
  // should not have to know which.
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.role) where.role = filters.role;

  return where;
}

function buildOrderBy(sort: UserSortOption): Prisma.UserOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "name":
      // Accounts with no name sort last rather than leading the list with a
      // column of blanks — Clerk allows an account with no name at all.
      return { name: { sort: "asc", nulls: "last" } };
    case "email":
      return { email: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

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

  /** One page of accounts plus the total matching the same filters. */
  async findMany(options: UserListOptions) {
    const { sort, skip, take, ...filters } = options;
    const where = buildWhere(filters);

    const [rows, total] = await Promise.all([
      db.user.findMany({
        where,
        select: listSelect,
        orderBy: buildOrderBy(sort),
        skip,
        take,
      }),
      db.user.count({ where }),
    ]);

    return { rows, total };
  },

  findDetailById(id: string) {
    return db.user.findUnique({ where: { id }, select: detailSelect });
  },

  /**
   * How many administrators the academy has.
   *
   * The one query behind the rule that the last one cannot be demoted — an
   * academy with no admin has no way back into its own console short of
   * editing the database by hand.
   */
  countByRole(role: UserRole) {
    return db.user.count({ where: { role } });
  },
};

export type AppUser = NonNullable<
  Awaited<ReturnType<typeof userRepository.findByClerkId>>
>;
