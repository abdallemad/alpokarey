import { Prisma, type PathCategory, type Status } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Data access for Path. The only layer allowed to touch Prisma.
 *
 * No business rules and no validation live here — just queries and the shapes
 * they return. Services decide what any of it *means*.
 */

export type PathSortOption = "newest" | "oldest" | "title";

export type PathListFilters = {
  search?: string;
  status?: Status;
  category?: PathCategory;
  isFeatured?: boolean;
};

export type PathListOptions = PathListFilters & {
  sort: PathSortOption;
  skip: number;
  take: number;
};

const listSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  status: true,
  category: true,
  isFeatured: true,
  certificationActivated: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { stages: true, enrollments: true } },
} satisfies Prisma.PathSelect;

const detailSelect = {
  ...listSelect,
  promoUrl: true,
  _count: { select: { stages: true, enrollments: true, certificates: true } },
  stages: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      _count: { select: { lessons: true, quizzes: true } },
    },
  },
} satisfies Prisma.PathSelect;

export type PathListRow = Prisma.PathGetPayload<{ select: typeof listSelect }>;
export type PathDetailRow = Prisma.PathGetPayload<{
  select: typeof detailSelect;
}>;

function buildWhere(filters: PathListFilters): Prisma.PathWhereInput {
  const where: Prisma.PathWhereInput = {};

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;

  return where;
}

function buildOrderBy(sort: PathSortOption): Prisma.PathOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "title":
      return { title: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

export const pathRepository = {
  /** One page of paths plus the total matching the same filters. */
  async findMany(options: PathListOptions) {
    const { sort, skip, take, ...filters } = options;
    const where = buildWhere(filters);

    const [rows, total] = await Promise.all([
      db.path.findMany({
        where,
        select: listSelect,
        orderBy: buildOrderBy(sort),
        skip,
        take,
      }),
      db.path.count({ where }),
    ]);

    return { rows, total };
  },

  findById(id: string) {
    return db.path.findUnique({ where: { id }, select: detailSelect });
  },

  /**
   * Just enough of a path to guard a child record — existence, name for an
   * error message, and publication state. Avoids pulling the whole stage tree
   * of `detailSelect` when all a caller needs is "does this path exist?".
   */
  findSummary(id: string) {
    return db.path.findUnique({
      where: { id },
      select: { id: true, title: true, status: true },
    });
  },

  create(data: Prisma.PathUncheckedCreateInput) {
    return db.path.create({ data, select: detailSelect });
  },

  update(id: string, data: Prisma.PathUncheckedUpdateInput) {
    return db.path.update({ where: { id }, data, select: detailSelect });
  },

  delete(id: string) {
    return db.path.delete({ where: { id }, select: { id: true } });
  },

  countEnrollments(id: string) {
    return db.enrollment.count({ where: { pathId: id } });
  },

  countStages(id: string) {
    return db.stage.count({ where: { pathId: id } });
  },
};
