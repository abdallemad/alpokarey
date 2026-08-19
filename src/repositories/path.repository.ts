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
 * A published path as a **card in the public catalog**.
 *
 * `stages.select._count.lessons` rather than `listSelect`'s enrolment count: a
 * card says how much there is to study, and an enrolment total on a
 * newly-launched path is a number better left unsaid.
 *
 * Shared by the landing page's six-card teaser and the browsable catalog, so
 * the same path cannot describe itself differently on the two screens it
 * appears on.
 */
const publicSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  category: true,
  certificationActivated: true,
  stages: { select: { _count: { select: { lessons: true } } } },
} satisfies Prisma.PathSelect;

export type PublicPathRow = Prisma.PathGetPayload<{
  select: typeof publicSelect;
}>;

export type PublicPathSortOption = "featured" | "newest" | "title";

export type PublicPathListOptions = {
  search?: string;
  category?: PathCategory;
  /** `undefined` means "no filter" — a path with or without a certificate. */
  certificationActivated?: boolean;
  sort: PublicPathSortOption;
  skip: number;
  take: number;
};

/**
 * The `where` every public read is built on.
 *
 * **`status: "PUBLISHED"` is not a parameter.** It is written here, once, and
 * no caller can pass it, override it or widen it — which is the whole reason
 * the public endpoint can safely accept a query string at all. A status the
 * caller could choose is a status the caller could set to `DRAFT`, publishing
 * every half-written path in the academy.
 */
function buildPublicWhere(
  filters: Pick<
    PublicPathListOptions,
    "search" | "category" | "certificationActivated"
  >,
): Prisma.PathWhereInput {
  const where: Prisma.PathWhereInput = { status: "PUBLISHED" };

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.category) where.category = filters.category;

  if (filters.certificationActivated !== undefined) {
    where.certificationActivated = filters.certificationActivated;
  }

  return where;
}

function buildPublicOrderBy(
  sort: PublicPathSortOption,
): Prisma.PathOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "title":
      return [{ title: "asc" }];
    // Featured first, then newest. `isFeatured` is the admin's own "show this
    // one" switch, and the catalog is the place it should finally mean
    // something.
    default:
      return [{ isFeatured: "desc" }, { createdAt: "desc" }];
  }
}

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
   * One page of the published catalog, plus the total matching the same
   * filters — the read behind `/paths`.
   *
   * The page query and its `count` run against the **same `where`** in one
   * `Promise.all`, so the total can never describe a different set of paths
   * from the cards under it.
   *
   * Filters are optional and additive; the one thing that is neither is
   * `status`, which `buildPublicWhere` writes and nobody passes.
   */
  async findPublishedMany(options: PublicPathListOptions) {
    const { sort, skip, take, ...filters } = options;
    const where = buildPublicWhere(filters);

    const [rows, total] = await Promise.all([
      db.path.findMany({
        where,
        select: publicSelect,
        orderBy: buildPublicOrderBy(sort),
        skip,
        take,
      }),
      db.path.count({ where }),
    ]);

    return { rows, total };
  },

  /**
   * One path with its curriculum outline, for `/paths/:pathId`.
   *
   * `findUnique` on the id alone, with no `status` in the `where`: unlike
   * `findPublishedMany`, this read has a caller who may legitimately be enrolled in
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
