import { Prisma, type Status } from "@prisma/client";

import { db } from "@/lib/db";
import type { QuizKindFilter, QuizSortOption } from "@/validation/quiz.schema";

/**
 * Data access for Quiz. Together with the other repositories, the only layer
 * allowed to touch Prisma.
 *
 * No business rules and no validation live here — just queries and the shapes
 * they return.
 */

export type QuizListFilters = {
  search?: string;
  pathId?: string;
  stageId?: string;
  kind?: QuizKindFilter;
  active?: boolean;
  pathStatus?: Status;
};

export type QuizListOptions = QuizListFilters & {
  sort: QuizSortOption;
  skip: number;
  take: number;
};

const listSelect = {
  id: true,
  title: true,
  description: true,
  passingScore: true,
  duration: true,
  order: true,
  isFinal: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { questions: true, attempts: true } },
  // The lesson link is a back-reference: `Lesson.quizId` points here, so the
  // exam's own row says nothing about it until the relation is read.
  lessons: { select: { id: true, title: true }, orderBy: { order: "asc" } },
  stage: {
    select: {
      id: true,
      title: true,
      order: true,
      path: { select: { id: true, title: true, status: true, category: true } },
    },
  },
} satisfies Prisma.QuizSelect;

const detailSelect = {
  ...listSelect,
  questions: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      text: true,
      options: {
        orderBy: { id: "asc" },
        select: { id: true, text: true, isCorrect: true },
      },
    },
  },
} satisfies Prisma.QuizSelect;

export type QuizListRow = Prisma.QuizGetPayload<{ select: typeof listSelect }>;
export type QuizDetailRow = Prisma.QuizGetPayload<{
  select: typeof detailSelect;
}>;

/**
 * The three attachment kinds as `where` clauses.
 *
 * `LESSON` and `UNLINKED` both exclude finals: a final exam belongs to the
 * stage, and whether some lesson also points at it is not how it should be
 * classified. That is the same precedence the Service uses when deriving
 * `kind` for display, so the filter and the badge can never disagree.
 */
function kindWhere(kind: QuizKindFilter): Prisma.QuizWhereInput {
  switch (kind) {
    case "FINAL":
      return { isFinal: true };
    case "LESSON":
      return { isFinal: false, lessons: { some: {} } };
    default:
      return { isFinal: false, lessons: { none: {} } };
  }
}

function buildWhere(filters: QuizListFilters): Prisma.QuizWhereInput {
  const where: Prisma.QuizWhereInput = {};

  // Searching up the chain, as on the lessons list: an admin hunting for an
  // exam usually remembers the stage or the path it belongs to.
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
  if (filters.active !== undefined) where.active = filters.active;

  if (filters.pathId || filters.pathStatus) {
    where.stage = {
      ...(filters.pathId && { pathId: filters.pathId }),
      ...(filters.pathStatus && { path: { status: filters.pathStatus } }),
    };
  }

  if (filters.kind) Object.assign(where, kindWhere(filters.kind));

  return where;
}

/**
 * Curriculum-major ordering, as on the lessons list: path, then stage, then the
 * chosen sort within the stage. Sorting by `order` alone would interleave
 * "exam 1" from every stage in the academy. The trailing `id` makes paging
 * deterministic when the sort key repeats.
 */
function buildOrderBy(
  sort: QuizSortOption,
): Prisma.QuizOrderByWithRelationInput[] {
  const byCurriculum: Prisma.QuizOrderByWithRelationInput[] = [
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

export const quizRepository = {
  /** One page of quizzes plus the total matching the same filters. */
  async findMany(options: QuizListOptions) {
    const { sort, skip, take, ...filters } = options;
    const where = buildWhere(filters);

    const [rows, total] = await Promise.all([
      db.quiz.findMany({
        where,
        select: listSelect,
        orderBy: buildOrderBy(sort),
        skip,
        take,
      }),
      db.quiz.count({ where }),
    ]);

    return { rows, total };
  },

  findById(id: string) {
    return db.quiz.findUnique({ where: { id }, select: detailSelect });
  },

  create(data: Prisma.QuizUncheckedCreateInput) {
    return db.quiz.create({ data, select: detailSelect });
  },

  update(id: string, data: Prisma.QuizUncheckedUpdateInput) {
    return db.quiz.update({ where: { id }, data, select: detailSelect });
  },

  delete(id: string) {
    return db.quiz.delete({ where: { id }, select: { id: true } });
  },

  /** Highest `order` currently used in a stage, or `null` when it has none. */
  async findMaxOrder(stageId: string) {
    const result = await db.quiz.aggregate({
      where: { stageId },
      _max: { order: true },
    });

    return result._max.order;
  },

  /** Another exam already sitting at this position. `excludeId` skips itself. */
  findByOrder(stageId: string, order: number, excludeId?: string) {
    return db.quiz.findFirst({
      where: { stageId, order, ...(excludeId && { id: { not: excludeId } }) },
      select: { id: true, title: true },
    });
  },

  /** The stage's existing final exam, if it has one. `excludeId` skips itself. */
  findFinalInStage(stageId: string, excludeId?: string) {
    return db.quiz.findFirst({
      where: {
        stageId,
        isFinal: true,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true, title: true },
    });
  },

  countAttempts(quizId: string) {
    return db.quizAttempt.count({ where: { quizId } });
  },
};
