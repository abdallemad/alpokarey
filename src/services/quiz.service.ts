import type { Status } from "@prisma/client";

import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { learnRepository } from "@/repositories/learn.repository";
import { lessonRepository } from "@/repositories/lesson.repository";
import { quizAttemptRepository } from "@/repositories/quiz-attempt.repository";
import {
  quizRepository,
  type QuizDetailRow,
  type QuizListRow,
} from "@/repositories/quiz.repository";
import { stageRepository } from "@/repositories/stage.repository";
import type { AppUser } from "@/repositories/user.repository";
import type { Paginated } from "@/types/api";
import type { QuizAttemptResult } from "@/types/learn";
import type { QuizDetail, QuizKind, QuizListItem } from "@/types/quiz";
import { requireEnrollment } from "@/services/learn.service";
import { toProgressPercent } from "@/utils/progress";
import type {
  QuizAttemptSubmitValues,
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
 * `submitAttempt` at the end is the exception: the only operation in this file
 * a **student** performs rather than an admin. It sits here anyway, because
 * what counts as a correct answer and what score passes are rules about the
 * exam, not about the screen it was answered on.
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

  /**
   * Grade and record a student's attempt.
   *
   * The one write in this Service a learner performs rather than an admin, and
   * it lives here because grading is a rule about the exam: what counts as the
   * right answer, and what score passes.
   *
   * The answers arrive as `{ questionId, optionId }` pairs and are checked
   * against the exam before anything is scored — a pair naming a question from
   * another exam, or an option from another question, is rejected rather than
   * silently marked wrong. Both are impossible through the runner and trivial
   * to send by hand.
   */
  async submitAttempt(
    user: AppUser,
    quizId: string,
    input: QuizAttemptSubmitValues,
  ): Promise<QuizAttemptResult> {
    const quiz = await learnRepository.findQuizForGrading(quizId);

    if (!quiz) {
      throw new NotFoundError("الاختبار المطلوب غير موجود");
    }

    await requireEnrollment(user.id, quiz.stage.path.id);

    // An inactive exam is one still being written. Refusing here rather than at
    // the read is what stops a submission racing an admin unpublishing it.
    if (!quiz.active) {
      throw new ConflictError("هذا الاختبار غير متاح للتقديم حاليًا");
    }

    if (quiz.questions.length === 0) {
      throw new ConflictError("لا يمكن تقديم اختبار بلا أسئلة");
    }

    const byQuestion = new Map(
      quiz.questions.map((question) => [question.id, question]),
    );
    const selectedByQuestion = new Map<string, string>();

    for (const answer of input.answers) {
      const question = byQuestion.get(answer.questionId);

      if (!question) {
        throw new ValidationError("إحدى الإجابات لا تنتمي إلى هذا الاختبار");
      }

      if (!question.options.some((option) => option.id === answer.optionId)) {
        throw new ValidationError(
          "إحدى الإجابات المختارة لا تنتمي إلى سؤالها",
        );
      }

      selectedByQuestion.set(answer.questionId, answer.optionId);
    }

    const review = quiz.questions.map((question) => {
      const correct = toCorrectOption(question);
      const selectedOptionId = selectedByQuestion.get(question.id) ?? null;
      const selected =
        question.options.find((option) => option.id === selectedOptionId) ??
        null;

      return {
        questionId: question.id,
        questionText: question.text,
        selectedOptionId,
        selectedOptionText: selected?.text ?? null,
        correctOptionId: correct?.id ?? null,
        correctOptionText: correct?.text ?? null,
        // An unanswered question is wrong, not an error: the runner does not
        // let a learner submit an incomplete exam, but throwing away the
        // answers they did give would serve nobody if one slipped through.
        isCorrect: correct !== null && selectedOptionId === correct.id,
      };
    });

    const correctCount = review.filter((item) => item.isCorrect).length;
    const score = toProgressPercent(correctCount, quiz.questions.length);
    const isPassed = score >= quiz.passingScore;

    const attempt = await quizAttemptRepository.create({
      userId: user.id,
      quizId,
      score,
      isPassed,
      answers: [...selectedByQuestion].map(([questionId, optionId]) => ({
        questionId,
        optionId,
      })),
    });

    // No certificate is issued here, deliberately. `business-analysis.md` §7
    // records an unresolved contradiction — the requirements promise a
    // certificate per *stage*, while `Certificate` is keyed by `(userId,
    // pathId)` — and inventing a rule for it inside a grading function is how
    // that decision would get made by accident.

    return {
      id: attempt.id,
      score: attempt.score,
      isPassed: attempt.isPassed,
      passingScore: quiz.passingScore,
      correctCount,
      questionsCount: quiz.questions.length,
      createdAt: attempt.createdAt.toISOString(),
      review,
    };
  },
};

/**
 * Which option is the right one — and why it takes three tries to answer.
 *
 * The schema records the correct answer **twice**: `Option.isCorrect` is a flag
 * on each option, and `Question.correctAnswer` is a string the model documents
 * as "ID of the correct option". Nothing keeps the two in step, and
 * `docs/quizzes-feature.md` §12 flags that they can disagree.
 *
 * **The flag wins**, because it is what the admin editor sets and what
 * `/admin/quizzes/[quizId]` already renders as correct.
 *
 * The two fallbacks are for questions with no flag at all, which would
 * otherwise mark every answer wrong — a broken exam from the student's side,
 * for what is really an authoring gap. `correctAnswer` is tried as an id
 * first, as the column is documented, and then as **text**: every row in the
 * live database holds the option's wording there rather than its id, so the
 * documented reading alone would never match anything (verified against the
 * database — see `docs/learning-feature.md` §9).
 *
 * A question none of the three resolve is scored as unanswerable: no answer is
 * correct, and the review says so rather than blaming the learner's choice.
 */
function toCorrectOption(question: {
  correctAnswer: string;
  options: { id: string; text: string; isCorrect: boolean }[];
}) {
  const answer = question.correctAnswer?.trim();

  return (
    question.options.find((option) => option.isCorrect) ??
    question.options.find((option) => option.id === answer) ??
    question.options.find((option) => option.text.trim() === answer) ??
    null
  );
}

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
