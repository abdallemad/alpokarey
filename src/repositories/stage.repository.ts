import { Prisma, type PathCategory, type Status } from "@prisma/client";

import { db } from "@/lib/db";
import type { StageSortOption } from "@/validation/stage.schema";

/**
 * Data access for Stage. Together with the other repositories, the only layer
 * allowed to touch Prisma.
 *
 * No business rules and no validation live here — just queries and the shapes
 * they return.
 */

export type StageListFilters = {
  search?: string;
  pathId?: string;
  pathStatus?: Status;
  pathCategory?: PathCategory;
  /** `true` → only stages that have lessons, `false` → only empty ones. */
  hasLessons?: boolean;
};

export type StageListOptions = StageListFilters & {
  sort: StageSortOption;
  /** Counted in **paths**, not stages — see `findGroupedPage`. */
  skip: number;
  take: number;
};

const listSelect = {
  id: true,
  title: true,
  order: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { lessons: true, quizzes: true } },
  path: { select: { id: true, title: true, status: true, category: true } },
} satisfies Prisma.StageSelect;

export type StageListRow = Prisma.StageGetPayload<{ select: typeof listSelect }>;

function buildWhere(filters: StageListFilters): Prisma.StageWhereInput {
  const where: Prisma.StageWhereInput = {};

  // Searching the parent's title too: an admin looking for "مرحلة" content
  // usually remembers the path it belongs to, not the stage's own wording.
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { path: { title: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  if (filters.pathId) where.pathId = filters.pathId;

  if (filters.pathStatus || filters.pathCategory) {
    where.path = {
      ...(filters.pathStatus && { status: filters.pathStatus }),
      ...(filters.pathCategory && { category: filters.pathCategory }),
    };
  }

  if (filters.hasLessons === true) where.lessons = { some: {} };
  if (filters.hasLessons === false) where.lessons = { none: {} };

  return where;
}

/**
 * Ordering is always **path-major**.
 *
 * The admin list renders stages grouped under their path, and a group can only
 * be drawn once if every row of a path is contiguous in the result set. The
 * chosen `sort` therefore orders stages *within* each path; the path block
 * itself is always alphabetical. `pathId` breaks ties between two paths that
 * share a title, and `id` makes paging deterministic when the sort key repeats.
 */
function buildOrderBy(
  sort: StageSortOption,
): Prisma.StageOrderByWithRelationInput[] {
  const byPath: Prisma.StageOrderByWithRelationInput[] = [
    { path: { title: "asc" } },
    { pathId: "asc" },
  ];

  switch (sort) {
    case "newest":
      return [...byPath, { createdAt: "desc" }, { id: "asc" }];
    case "oldest":
      return [...byPath, { createdAt: "asc" }, { id: "asc" }];
    case "title":
      return [...byPath, { title: "asc" }, { id: "asc" }];
    default:
      return [...byPath, { order: "asc" }, { id: "asc" }];
  }
}

export const stageRepository = {
  /**
   * One page of **paths**, with every matching stage belonging to them.
   *
   * The unit of pagination is the path, not the stage: the list renders each
   * path as a block, and a block cut in half by a page boundary — three of a
   * path's five stages here, the other two on the next page — reads as missing
   * data. So the page is taken over the paths that have a matching stage, and
   * then every matching stage of those paths is fetched, however many that is.
   *
   * `skip`/`take` therefore count paths. `totalStages` is reported separately
   * because it is what the admin actually wants to know the size of.
   */
  async findGroupedPage(options: StageListOptions) {
    const { sort, skip, take, ...filters } = options;
    const where = buildWhere(filters);

    // Same ordering as `buildOrderBy`'s path-major prefix, so the paths on this
    // page appear in the same sequence as the rows fetched for them.
    const pathsWithMatches = { stages: { some: where } };

    const [paths, totalPaths, totalStages] = await Promise.all([
      db.path.findMany({
        where: pathsWithMatches,
        orderBy: [{ title: "asc" }, { id: "asc" }],
        select: { id: true },
        skip,
        take,
      }),
      db.path.count({ where: pathsWithMatches }),
      db.stage.count({ where }),
    ]);

    const pathIds = paths.map((path) => path.id);

    const rows = pathIds.length
      ? await db.stage.findMany({
          where: { AND: [where, { pathId: { in: pathIds } }] },
          select: listSelect,
          orderBy: buildOrderBy(sort),
        })
      : [];

    return { rows, totalPaths, totalStages };
  },

  findById(id: string) {
    return db.stage.findUnique({ where: { id }, select: listSelect });
  },

  create(data: Prisma.StageUncheckedCreateInput) {
    return db.stage.create({ data, select: listSelect });
  },

  update(id: string, data: Prisma.StageUncheckedUpdateInput) {
    return db.stage.update({ where: { id }, data, select: listSelect });
  },

  delete(id: string) {
    return db.stage.delete({ where: { id }, select: { id: true } });
  },

  /** Highest `order` currently used in a path, or `null` when it has none. */
  async findMaxOrder(pathId: string) {
    const result = await db.stage.aggregate({
      where: { pathId },
      _max: { order: true },
    });

    return result._max.order;
  },

  /** Another stage already sitting at this position. `excludeId` skips itself. */
  findByOrder(pathId: string, order: number, excludeId?: string) {
    return db.stage.findFirst({
      where: { pathId, order, ...(excludeId && { id: { not: excludeId } }) },
      select: { id: true, title: true },
    });
  },

  countInPath(pathId: string) {
    return db.stage.count({ where: { pathId } });
  },

  /**
   * Student progress recorded against any lesson of this stage.
   *
   * Deleting the stage cascades to its lessons and from there to
   * `LessonProgress`, so this is what stands between a restructure and a
   * silent loss of student history.
   */
  countLessonProgress(stageId: string) {
    return db.lessonProgress.count({ where: { lesson: { stageId } } });
  },
};
