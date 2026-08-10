import type { LessonType, Status } from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { storage } from "@/lib/storage";
import { attachmentRepository } from "@/repositories/attachment.repository";
import {
  lessonRepository,
  type LessonDetailRow,
  type LessonListRow,
} from "@/repositories/lesson.repository";
import { stageRepository } from "@/repositories/stage.repository";
import type { Paginated } from "@/types/api";
import type {
  LessonAttachment,
  LessonDetail,
  LessonListItem,
} from "@/types/lesson";
import type {
  AttachmentCreateValues,
  LessonCreateValues,
  LessonListQuery,
  LessonUpdateValues,
} from "@/validation/lesson.schema";

/**
 * Business logic for lessons and their attachments.
 *
 * Attachments live here rather than in a service of their own because they are
 * not an independent entity: an attachment only ever exists as part of a
 * lesson, and the rules about it are rules about the lesson it belongs to.
 *
 * Knows nothing about HTTP — no `Request`, no `Response`.
 */

function toListItem(row: LessonListRow): LessonListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    contentType: row.contentType,
    duration: row.duration,
    order: row.order,
    attachmentsCount: row._count.attachments,
    hasQuiz: row.quizId !== null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    stage: {
      id: row.stage.id,
      title: row.stage.title,
      order: row.stage.order,
      path: {
        id: row.stage.path.id,
        title: row.stage.path.title,
        status: row.stage.path.status,
        category: row.stage.path.category,
      },
    },
  };
}

function toDetail(row: LessonDetailRow): LessonDetail {
  return {
    ...toListItem(row),
    videoUrl: row.videoUrl,
    content: row.content,
    completionsCount: row._count.progress,
    attachments: row.attachments.map(toAttachment),
  };
}

function toAttachment(row: {
  id: string;
  name: string;
  type: LessonAttachment["type"];
  content: string | null;
  url: string | null;
  createdAt: Date;
}): LessonAttachment {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    content: row.content,
    url: row.url,
    createdAt: row.createdAt.toISOString(),
  };
}

/** `"all"` means "no filter" — translate it to `undefined` for the repository. */
function unwrapFilter<T extends string>(value: T | "all"): T | undefined {
  return value === "all" ? undefined : value;
}

export const lessonService = {
  async listLessons(query: LessonListQuery): Promise<Paginated<LessonListItem>> {
    const { page, pageSize } = query;

    const { rows, total } = await lessonRepository.findMany({
      search: query.search || undefined,
      pathId: unwrapFilter(query.pathId),
      stageId: unwrapFilter(query.stageId),
      type: unwrapFilter(query.type) as LessonType | undefined,
      pathStatus: unwrapFilter(query.status) as Status | undefined,
      sort: query.sort,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: rows.map(toListItem),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async getLesson(id: string): Promise<LessonDetail> {
    const row = await lessonRepository.findById(id);

    if (!row) {
      throw new NotFoundError("الدرس المطلوب غير موجود");
    }

    return toDetail(row);
  },

  async createLesson(input: LessonCreateValues): Promise<LessonDetail> {
    const stage = await stageRepository.findById(input.stageId);

    if (!stage) {
      throw new NotFoundError("المرحلة المحددة غير موجودة");
    }

    // An omitted order means "add it at the end", which is what an author
    // building a stage top-to-bottom expects.
    const order = input.order ?? (await nextOrder(input.stageId));

    await assertOrderIsFree(input.stageId, order);

    const row = await lessonRepository.create({
      stageId: input.stageId,
      title: input.title,
      description: input.description,
      type: input.type,
      contentType: input.contentType,
      videoUrl: input.videoUrl,
      content: input.content,
      duration: input.duration,
      order,
    });

    return toDetail(row);
  },

  async updateLesson(
    id: string,
    input: LessonUpdateValues,
  ): Promise<LessonDetail> {
    const existing = await lessonRepository.findById(id);

    if (!existing) {
      throw new NotFoundError("الدرس المطلوب غير موجود");
    }

    if (input.order != null && input.order !== existing.order) {
      await assertOrderIsFree(existing.stage.id, input.order, id);
    }

    const row = await lessonRepository.update(id, {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.contentType !== undefined && {
        contentType: input.contentType,
      }),
      ...(input.videoUrl !== undefined && { videoUrl: input.videoUrl }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.duration !== undefined && { duration: input.duration }),
      // `null` here is "leave it where it is" — an emptied order field is not a
      // request to renumber, unlike on create where it means "append".
      ...(input.order != null && { order: input.order }),
    });

    return toDetail(row);
  },

  async deleteLesson(id: string): Promise<{ id: string }> {
    const lesson = await lessonRepository.findById(id);

    if (!lesson) {
      throw new NotFoundError("الدرس المطلوب غير موجود");
    }

    const completions = await lessonRepository.countProgress(id);

    // Deleting cascades to LessonProgress. Once students have completed the
    // lesson that would erase their history and silently change the progress
    // percentage of every enrollment in the path.
    if (completions > 0) {
      throw new ConflictError(
        `لا يمكن حذف الدرس لوجود ${completions} سجل إتمام لطلاب. أزل الدرس من المرحلة بتحويل المسار إلى مسودة بدلًا من ذلك.`,
      );
    }

    // Read the storage keys *before* the cascade removes the rows that hold
    // them, or the files would be orphaned on disk with nothing pointing at
    // them.
    const keys = await attachmentRepository.findKeysByLesson(id);

    const deleted = await lessonRepository.delete(id);

    await Promise.all(
      keys.map((row) => storage.remove(row.cloudinaryPublicId)),
    );

    return deleted;
  },

  async addAttachment(
    lessonId: string,
    input: AttachmentCreateValues,
  ): Promise<LessonAttachment> {
    const lesson = await lessonRepository.findById(lessonId);

    if (!lesson) {
      throw new NotFoundError("الدرس المطلوب غير موجود");
    }

    const row = await attachmentRepository.create({
      lessonId,
      name: input.name,
      type: input.type,
      // Each branch keeps only the half that belongs to it, so a FILE
      // attachment can never carry a stray body from an abandoned TEXT draft.
      content: input.type === "TEXT" ? input.content : null,
      url: input.type === "FILE" ? input.url : null,
      cloudinaryPublicId: input.type === "FILE" ? input.storageKey : null,
    });

    return toAttachment(row);
  },

  async removeAttachment(attachmentId: string): Promise<{ id: string }> {
    const attachment = await attachmentRepository.findById(attachmentId);

    if (!attachment) {
      throw new NotFoundError("المرفق المطلوب غير موجود");
    }

    const deleted = await attachmentRepository.delete(attachmentId);

    // The row is the record that matters, so the file is removed after it —
    // a failed unlink leaves a stray file, not a broken attachment.
    await storage.remove(attachment.cloudinaryPublicId);

    return deleted;
  },
};

async function nextOrder(stageId: string): Promise<number> {
  const max = await lessonRepository.findMaxOrder(stageId);
  return (max ?? 0) + 1;
}

/**
 * Two lessons sharing a position inside one stage would make the study
 * sequence ambiguous. The database has no unique constraint on
 * `(stageId, order)`, so the rule is enforced here — the same rule stages
 * enforce against their path.
 */
async function assertOrderIsFree(
  stageId: string,
  order: number,
  excludeId?: string,
): Promise<void> {
  const taken = await lessonRepository.findByOrder(stageId, order, excludeId);

  if (taken) {
    throw new ConflictError(
      `الترتيب ${order} مستخدم بالفعل في هذه المرحلة للدرس «${taken.title}». اختر ترتيبًا آخر.`,
    );
  }
}
