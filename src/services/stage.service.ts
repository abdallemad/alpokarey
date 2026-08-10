import type { PathCategory, Status } from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { pathRepository } from "@/repositories/path.repository";
import {
  stageRepository,
  type StageListRow,
} from "@/repositories/stage.repository";
import type { StageListItem, StagesPage } from "@/types/stage";
import { groupStagesByPath } from "@/utils/stage";
import type {
  StageCreateValues,
  StageListQuery,
  StageUpdateValues,
} from "@/validation/stage.schema";

/**
 * Business logic for stages.
 *
 * Knows nothing about HTTP — no `Request`, no `Response` — so the same
 * functions are callable from an API route today or a queue worker later.
 */

function toListItem(row: StageListRow): StageListItem {
  return {
    id: row.id,
    title: row.title,
    order: row.order,
    lessonsCount: row._count.lessons,
    quizzesCount: row._count.quizzes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    path: {
      id: row.path.id,
      title: row.path.title,
      status: row.path.status,
      category: row.path.category,
    },
  };
}

/** `"all"` means "no filter" — translate it to `undefined` for the repository. */
function unwrapFilter<T extends string>(value: T | "all"): T | undefined {
  return value === "all" ? undefined : value;
}

export const stageService = {
  /**
   * A page of the stages list, already grouped by path.
   *
   * Grouping happens here rather than in the client because the server is what
   * decides which paths fit on the page — see `stageRepository.findGroupedPage`
   * for why the page unit is the path. `pageSize` therefore counts paths.
   */
  async listStages(query: StageListQuery): Promise<StagesPage> {
    const { page, pageSize } = query;

    const { rows, totalPaths, totalStages } =
      await stageRepository.findGroupedPage({
        search: query.search || undefined,
        pathId: unwrapFilter(query.pathId),
        pathStatus: unwrapFilter(query.status) as Status | undefined,
        pathCategory: unwrapFilter(query.category) as PathCategory | undefined,
        // "withLessons"/"empty" is a UI vocabulary; the repository only knows
        // whether the relation should be non-empty.
        hasLessons:
          query.content === "all" ? undefined : query.content === "withLessons",
        sort: query.sort,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

    return {
      items: groupStagesByPath(rows.map(toListItem)),
      page,
      pageSize,
      total: totalPaths,
      totalPages: Math.max(1, Math.ceil(totalPaths / pageSize)),
      totalStages,
    };
  },

  async getStage(id: string): Promise<StageListItem> {
    const row = await stageRepository.findById(id);

    if (!row) {
      throw new NotFoundError("المرحلة المطلوبة غير موجودة");
    }

    return toListItem(row);
  },

  async createStage(input: StageCreateValues): Promise<StageListItem> {
    const path = await pathRepository.findSummary(input.pathId);

    if (!path) {
      throw new NotFoundError("المسار المحدد غير موجود");
    }

    // An omitted order means "add it at the end", which is what an admin
    // building a curriculum top-to-bottom expects.
    const order = input.order ?? (await nextOrder(input.pathId));

    await assertOrderIsFree(input.pathId, order);

    const row = await stageRepository.create({
      pathId: input.pathId,
      title: input.title,
      order,
    });

    return toListItem(row);
  },

  async updateStage(
    id: string,
    input: StageUpdateValues,
  ): Promise<StageListItem> {
    const existing = await stageRepository.findById(id);

    if (!existing) {
      throw new NotFoundError("المرحلة المطلوبة غير موجودة");
    }

    if (input.order != null && input.order !== existing.order) {
      await assertOrderIsFree(existing.path.id, input.order, id);
    }

    const row = await stageRepository.update(id, {
      ...(input.title !== undefined && { title: input.title }),
      // `null` here is "leave it where it is" — an emptied order field is not a
      // request to renumber, unlike on create where it means "append".
      ...(input.order != null && { order: input.order }),
    });

    return toListItem(row);
  },

  async deleteStage(id: string): Promise<{ id: string }> {
    const stage = await stageRepository.findById(id);

    if (!stage) {
      throw new NotFoundError("المرحلة المطلوبة غير موجودة");
    }

    const [progressRecords, siblings] = await Promise.all([
      stageRepository.countLessonProgress(id),
      stageRepository.countInPath(stage.path.id),
    ]);

    // Deleting cascades to lessons and from there to LessonProgress. Once a
    // student has started the stage that would erase their history.
    if (progressRecords > 0) {
      throw new ConflictError(
        `لا يمكن حذف المرحلة لوجود ${progressRecords} سجل تقدّم لطلاب في دروسها. احذف الدروس المرتبطة أو حوّل المسار إلى مسودة بدلًا من ذلك.`,
      );
    }

    // Mirrors the path rule: a published path may never have zero stages, so
    // the last one cannot be removed while the path is live.
    if (siblings <= 1 && stage.path.status === "PUBLISHED") {
      throw new ConflictError(
        "لا يمكن حذف المرحلة الوحيدة في مسار منشور. حوّل المسار إلى مسودة أولًا.",
      );
    }

    return stageRepository.delete(id);
  },
};

async function nextOrder(pathId: string): Promise<number> {
  const max = await stageRepository.findMaxOrder(pathId);
  return (max ?? 0) + 1;
}

/**
 * Two stages sharing a position inside one path would make the curriculum's
 * sequence ambiguous. The database has no unique constraint on
 * `(pathId, order)`, so the rule is enforced here.
 */
async function assertOrderIsFree(
  pathId: string,
  order: number,
  excludeId?: string,
): Promise<void> {
  const taken = await stageRepository.findByOrder(pathId, order, excludeId);

  if (taken) {
    throw new ConflictError(
      `الترتيب ${order} مستخدم بالفعل في هذا المسار للمرحلة «${taken.title}». اختر ترتيبًا آخر.`,
    );
  }
}
