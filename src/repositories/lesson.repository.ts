import { Prisma, type LessonType, type Status } from "@prisma/client";

import { db } from "@/lib/db";
import type { LessonSortOption } from "@/validation/lesson.schema";

/**
 * Data access for Lesson. Together with the other repositories, the only layer
 * allowed to touch Prisma.
 *
 * No business rules and no validation live here — just queries and the shapes
 * they return.
 */

export type LessonListFilters = {
  search?: string;
  pathId?: string;
  stageId?: string;
  type?: LessonType;
  pathStatus?: Status;
};

export type LessonListOptions = LessonListFilters & {
  sort: LessonSortOption;
  skip: number;
  take: number;
};

const stageSelect = {
  id: true,
  title: true,
  order: true,
  path: { select: { id: true, title: true, status: true, category: true } },
} satisfies Prisma.StageSelect;

const listSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  contentType: true,
  duration: true,
  order: true,
  quizId: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { attachments: true } },
  stage: { select: stageSelect },
} satisfies Prisma.LessonSelect;

const detailSelect = {
  ...listSelect,
  videoUrl: true,
  content: true,
  _count: { select: { attachments: true, progress: true } },
  attachments: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      content: true,
      url: true,
      cloudinaryPublicId: true,
      createdAt: true,
    },
  },
} satisfies Prisma.LessonSelect;

export type LessonListRow = Prisma.LessonGetPayload<{
  select: typeof listSelect;
}>;
export type LessonDetailRow = Prisma.LessonGetPayload<{
  select: typeof detailSelect;
}>;

function buildWhere(filters: LessonListFilters): Prisma.LessonWhereInput {
  const where: Prisma.LessonWhereInput = {};

  // Searching up the chain: an admin hunting for a lesson usually remembers
  // the stage or the path it sits in, not its exact wording.
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { stage: { title: { contains: filters.search, mode: "insensitive" } } },
      {
        stage: {
          path: { title: { contains: filters.search, mode: "insensitive" } },
        },
      },
    ];
  }

  if (filters.stageId) where.stageId = filters.stageId;
  if (filters.type) where.type = filters.type;

  if (filters.pathId || filters.pathStatus) {
    where.stage = {
      ...(filters.pathId && { pathId: filters.pathId }),
      ...(filters.pathStatus && { path: { status: filters.pathStatus } }),
    };
  }

  return where;
}

/**
 * Ordering is curriculum-major: path, then stage, then the chosen sort within
 * the stage. A flat list of lessons ordered by `order` alone would interleave
 * "lesson 1" from every stage in the academy, which reads as noise. The
 * trailing `id` makes paging deterministic when the sort key repeats.
 */
function buildOrderBy(
  sort: LessonSortOption,
): Prisma.LessonOrderByWithRelationInput[] {
  const byCurriculum: Prisma.LessonOrderByWithRelationInput[] = [
    { stage: { path: { title: "asc" } } },
    { stage: { order: "asc" } },
    { stageId: "asc" },
  ];

  switch (sort) {
    case "newest":
      return [...byCurriculum, { createdAt: "desc" }, { id: "asc" }];
    case "oldest":
      return [...byCurriculum, { createdAt: "asc" }, { id: "asc" }];
    case "title":
      return [...byCurriculum, { title: "asc" }, { id: "asc" }];
    default:
      return [...byCurriculum, { order: "asc" }, { id: "asc" }];
  }
}

export const lessonRepository = {
  /** One page of lessons plus the total matching the same filters. */
  async findMany(options: LessonListOptions) {
    const { sort, skip, take, ...filters } = options;
    const where = buildWhere(filters);

    const [rows, total] = await Promise.all([
      db.lesson.findMany({
        where,
        select: listSelect,
        orderBy: buildOrderBy(sort),
        skip,
        take,
      }),
      db.lesson.count({ where }),
    ]);

    return { rows, total };
  },

  findById(id: string) {
    return db.lesson.findUnique({ where: { id }, select: detailSelect });
  },

  create(data: Prisma.LessonUncheckedCreateInput) {
    return db.lesson.create({ data, select: detailSelect });
  },

  update(id: string, data: Prisma.LessonUncheckedUpdateInput) {
    return db.lesson.update({ where: { id }, data, select: detailSelect });
  },

  delete(id: string) {
    return db.lesson.delete({ where: { id }, select: { id: true } });
  },

  /** Highest `order` currently used in a stage, or `null` when it has none. */
  async findMaxOrder(stageId: string) {
    const result = await db.lesson.aggregate({
      where: { stageId },
      _max: { order: true },
    });

    return result._max.order;
  },

  /** Another lesson already sitting at this position. `excludeId` skips itself. */
  findByOrder(stageId: string, order: number, excludeId?: string) {
    return db.lesson.findFirst({
      where: { stageId, order, ...(excludeId && { id: { not: excludeId } }) },
      select: { id: true, title: true },
    });
  },

  countProgress(lessonId: string) {
    return db.lessonProgress.count({ where: { lessonId } });
  },
};
