import type { Status } from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { lessonRepository } from "@/repositories/lesson.repository";
import {
  quizRepository,
  type QuizDetailRow,
  type QuizListRow,
} from "@/repositories/quiz.repository";
import { stageRepository } from "@/repositories/stage.repository";
import type { Paginated } from "@/types/api";
import type { QuizDetail, QuizKind, QuizListItem } from "@/types/quiz";
import type {
  QuizCreateValues,
  QuizKindFilter,
  QuizListQuery,
  QuizUpdateValues,
} from "@/validation/quiz.schema";

/**
 * Business logic for exams.
 *
 * The rules here are mostly about *attachment* — an exam is either a stage's
 * final or a lesson's, never both and never neither by accident — because that
 * is the one thing about a quiz the data model cannot enforce on its own.
 *
 * Knows nothing about HTTP — no `Request`, no `Response`.
 */

/**
 * `isFinal` wins over a lesson link.
 *
 * A stray `Lesson.quizId` pointing at a final exam should not reclassify it:
 * the final belongs to the stage. `quizRepository.kindWhere` filters with the
 * same precedence, so the badge and the filter always agree.
 */
function toKind(row: { isFinal: boolean; lessons: unknown[] }): QuizKind {
  if (row.isFinal) return "FINAL";
  return row.lessons.length > 0 ? "LESSON" : "UNLINKED";
}

function toListItem(row: QuizListRow): QuizListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    passingScore: row.passingScore,
    duration: row.duration,
    order: row.order,
    isFinal: row.isFinal,
    active: row.active,
    kind: toKind(row),
    questionsCount: row._count.questions,
    attemptsCount: row._count.attempts,
    linkedLessons: row.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
    })),
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

function toDetail(row: QuizDetailRow): QuizDetail {
  return {
    ...toListItem(row),
    questions: row.questions.map((question) => ({
      id: question.id,
      text: question.text,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
        isCorrect: option.isCorrect,
      })),
    })),
  };
}

/** `"all"` means "no filter" — translate it to `undefined` for the repository. */
function unwrapFilter<T extends string>(value: T | "all"): T | undefined {
  return value === "all" ? undefined : value;
}

export const quizService = {
  async listQuizzes(query: QuizListQuery): Promise<Paginated<QuizListItem>> {
    const { page, pageSize } = query;

    const { rows, total } = await quizRepository.findMany({
      search: query.search || undefined,
      pathId: unwrapFilter(query.pathId),
      stageId: unwrapFilter(query.stageId),
      kind: unwrapFilter(query.kind) as QuizKindFilter | undefined,
      active: query.active === "all" ? undefined : query.active === "true",
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

  async getQuiz(id: string): Promise<QuizDetail> {
    const row = await quizRepository.findById(id);

    if (!row) {
      throw new NotFoundError("الاختبار المطلوب غير موجود");
    }

    return toDetail(row);
  },

  async createQuiz(input: QuizCreateValues): Promise<QuizDetail> {
    const stage = await stageRepository.findById(input.stageId);

    if (!stage) {
      throw new NotFoundError("المرحلة المحددة غير موجودة");
    }

    assertAttachmentIsCoherent(input.isFinal, input.lessonId);

    if (input.isFinal) {
      await assertStageHasNoOtherFinal(input.stageId);
    }

    if (input.lessonId) {
      await assertLessonIsInStage(input.lessonId, input.stageId);
    }

    // A brand-new exam has no questions yet, so it can never start out active.
    if (input.active) {
      throw new ConflictError(
        "لا يمكن تفعيل اختبار جديد قبل إضافة أسئلته. أنشئه غير مفعّل ثم فعّله بعد إضافة الأسئلة.",
      );
    }

    const order = input.order ?? (await nextOrder(input.stageId));

    await assertOrderIsFree(input.stageId, order);

    const row = await quizRepository.create({
      stageId: input.stageId,
      title: input.title,
      description: input.description,
      passingScore: input.passingScore,
      duration: input.duration,
      order,
      isFinal: input.isFinal,
      active: false,
    });

    if (input.lessonId) {
      await lessonRepository.setQuizLink(row.id, input.lessonId);
    }

    return this.getQuiz(row.id);
  },

  async updateQuiz(id: string, input: QuizUpdateValues): Promise<QuizDetail> {
    const existing = await quizRepository.findById(id);

    if (!existing) {
      throw new NotFoundError("الاختبار المطلوب غير موجود");
    }

    const stageId = existing.stage.id;
    const isFinal = input.isFinal ?? existing.isFinal;
    // `undefined` means "not submitted"; `null` means "unlink".
    const lessonId =
      input.lessonId === undefined
        ? (existing.lessons[0]?.id ?? null)
        : input.lessonId;

    assertAttachmentIsCoherent(isFinal, lessonId);

    if (isFinal && !existing.isFinal) {
      await assertStageHasNoOtherFinal(stageId, id);
    }

    if (lessonId) {
      await assertLessonIsInStage(lessonId, stageId);
    }

    // An active exam with no questions is one a student can open and not
    // answer. Activation is gated on having something to ask.
    if (input.active === true && existing._count.questions === 0) {
      throw new ConflictError(
        "لا يمكن تفعيل الاختبار قبل إضافة سؤال واحد على الأقل.",
      );
    }

    if (input.order != null && input.order !== existing.order) {
      await assertOrderIsFree(stageId, input.order, id);
    }

    await quizRepository.update(id, {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.passingScore !== undefined && {
        passingScore: input.passingScore,
      }),
      ...(input.duration !== undefined && { duration: input.duration }),
      ...(input.isFinal !== undefined && { isFinal: input.isFinal }),
      ...(input.active !== undefined && { active: input.active }),
      // `null` here is "leave it where it is" — an emptied order field is not a
      // request to renumber, unlike on create where it means "append".
      ...(input.order != null && { order: input.order }),
    });

    // Only touch the Lesson table when the link was actually submitted, so a
    // PATCH that changes a title cannot silently detach an exam.
    if (input.lessonId !== undefined) {
      await lessonRepository.setQuizLink(id, isFinal ? null : input.lessonId);
    } else if (isFinal && existing.lessons.length > 0) {
      // Promoting an exam to "final" detaches it from its lesson, because the
      // two attachments are mutually exclusive.
      await lessonRepository.setQuizLink(id, null);
    }

    return this.getQuiz(id);
  },

  async deleteQuiz(id: string): Promise<{ id: string }> {
    const quiz = await quizRepository.findById(id);

    if (!quiz) {
      throw new NotFoundError("الاختبار المطلوب غير موجود");
    }

    const attempts = await quizRepository.countAttempts(id);

    // Deleting cascades to QuizAttempt and QuizAnswer. Once students have sat
    // the exam that would erase the record their certificates rest on.
    if (attempts > 0) {
      throw new ConflictError(
        `لا يمكن حذف الاختبار لوجود ${attempts} محاولة مسجّلة للطلاب. يمكنك إلغاء تفعيله بدلًا من حذفه.`,
      );
    }

    // Lessons pointing here would keep a dangling `quizId` — the relation is
    // optional, so the database would not stop it.
    await lessonRepository.setQuizLink(id, null);

    return quizRepository.delete(id);
  },
};

/**
 * A final exam belongs to the stage; a linked exam belongs to a lesson. An
 * exam claiming both would appear twice in a student's path with different
 * meanings, so the combination is refused rather than silently resolved.
 */
function assertAttachmentIsCoherent(
  isFinal: boolean,
  lessonId: string | null,
): void {
  if (isFinal && lessonId) {
    throw new ConflictError(
      "الاختبار النهائي يخصّ المرحلة كاملة، فلا يمكن ربطه بدرس. أزل الربط بالدرس أو ألغِ تحديده كاختبار نهائي.",
    );
  }
}

/** `business-analysis.md` §4.4: one final exam per stage, not several. */
async function assertStageHasNoOtherFinal(
  stageId: string,
  excludeId?: string,
): Promise<void> {
  const existing = await quizRepository.findFinalInStage(stageId, excludeId);

  if (existing) {
    throw new ConflictError(
      `المرحلة لديها اختبار نهائي بالفعل: «${existing.title}». ألغِ تحديده كاختبار نهائي أولًا.`,
    );
  }
}

/**
 * A lesson from another stage would put the exam in two places at once — shown
 * inside one stage's lesson, counted in another stage's quizzes.
 */
async function assertLessonIsInStage(
  lessonId: string,
  stageId: string,
): Promise<void> {
  const lesson = await lessonRepository.findById(lessonId);

  if (!lesson) {
    throw new NotFoundError("الدرس المحدد غير موجود");
  }

  if (lesson.stage.id !== stageId) {
    throw new ConflictError(
      "لا يمكن ربط الاختبار بدرس من مرحلة أخرى. اختر درسًا من نفس المرحلة.",
    );
  }
}

async function nextOrder(stageId: string): Promise<number> {
  const max = await quizRepository.findMaxOrder(stageId);
  return (max ?? 0) + 1;
}

/**
 * Two exams sharing a position inside one stage would make the sequence
 * ambiguous. The database has no unique constraint on `(stageId, order)`, so
 * the rule is enforced here — the same rule stages and lessons enforce.
 */
async function assertOrderIsFree(
  stageId: string,
  order: number,
  excludeId?: string,
): Promise<void> {
  const taken = await quizRepository.findByOrder(stageId, order, excludeId);

  if (taken) {
    throw new ConflictError(
      `الترتيب ${order} مستخدم بالفعل في هذه المرحلة للاختبار «${taken.title}». اختر ترتيبًا آخر.`,
    );
  }
}
