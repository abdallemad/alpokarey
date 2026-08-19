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

/**
 * One published path as the **public detail page** shows it — the curriculum
 * outline, and nothing a visitor has not earned.
 *
 * Deliberately not `detailSelect`. That shape carries `isFeatured` and the
 * enrolment and certificate totals, which are the admin's business; this one
 * carries lesson titles instead, because the question a visitor is asking is
 * "what would I actually study?".
 *
 * Two details are load-bearing:
 *
 * - **Lessons are ordered `order` then `id`** — the identical tie-break
 *   `learn.repository.ts` uses for the curriculum. The first lesson listed here
 *   has to be the first lesson the player opens, or "ابدأ المسار" would land
 *   somewhere other than the top of the outline it was pressed beside.
 * - **Only active exams are selected.** An inactive exam is one still being
 *   written; the player hides it, so the count here must not advertise it.
 *
 * `status` is selected, but not filtered on: whether a draft may be seen is a
 * question about *who is asking*, and that is the Service's call.
 */
const overviewSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  promoUrl: true,
  category: true,
  status: true,
  certificationActivated: true,
  stages: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      lessons: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: {
          id: true,
          title: true,
          order: true,
          type: true,
          duration: true,
        },
      },
      quizzes: { where: { active: true }, select: { id: true } },
    },
  },
} satisfies Prisma.PathSelect;

export type PathListRow = Prisma.PathGetPayload<{ select: typeof listSelect }>;
export type PathDetailRow = Prisma.PathGetPayload<{
  select: typeof detailSelect;
}>;
export type PathOverviewRow = Prisma.PathGetPayload<{
  select: typeof overviewSelect;
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

  /**
   * The published catalog — what the public landing page may show.
   *
   * `status: "PUBLISHED"` is baked into the query rather than passed in as a
   * filter. This read is reached through an **unauthenticated** endpoint, and a
   * status the caller could choose is a status the caller could set to `DRAFT`
   * — publishing every half-written path in the academy. The one query the
   * public can trigger cannot be talked into returning drafts.
   *
   * `stages.select._count.lessons` rather than `listSelect`'s enrollment count:
   * a card says how much there is to study, and an enrolment total on a
   * newly-launched path is a number better left unsaid.
   */
  findPublished(take: number) {
    return db.path.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        category: true,
        certificationActivated: true,
        stages: { select: { _count: { select: { lessons: true } } } },
      },
      // Featured first, then newest. `isFeatured` is the admin's own "show this
      // one" switch, and the catalog is the place it should finally mean
      // something.
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take,
    });
  },

  /**
   * One path with its curriculum outline, for `/paths/:pathId`.
   *
   * `findUnique` on the id alone, with no `status` in the `where`: unlike
   * `findPublished`, this read has a caller who may legitimately be enrolled in
   * an unpublished path, and refusing in SQL would hide their own course from
   * them. The status is returned instead, and `pathService.getPathOverview`
   * decides what it means for the person asking.
   */
  findOverview(id: string) {
    return db.path.findUnique({ where: { id }, select: overviewSelect });
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
