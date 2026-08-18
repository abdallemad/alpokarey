import { db } from "@/lib/db";

/**
 * Data access for `LessonProgress` — the record of which lessons a learner has
 * finished.
 *
 * Every query takes a `userId` and filters by it, like
 * `student.repository.ts`: there is no read here that spans learners, so a
 * caller cannot serve one student another's progress by mistake.
 */
export const lessonProgressRepository = {
  findByUserAndLesson(userId: string, lessonId: string) {
    return db.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { lessonId: true, isCompleted: true, completedAt: true },
    });
  },

  /**
   * Which of these lessons the learner has finished.
   *
   * Scoped to a lesson id list rather than reading every row for the user,
   * because the caller is always asking about one path's curriculum.
   */
  async findCompletedIds(
    userId: string,
    lessonIds: string[],
  ): Promise<string[]> {
    if (lessonIds.length === 0) return [];

    const rows = await db.lessonProgress.findMany({
      where: { userId, isCompleted: true, lessonId: { in: lessonIds } },
      select: { lessonId: true },
    });

    return rows.map((row) => row.lessonId);
  },

  /**
   * Record — or withdraw — a completion.
   *
   * An upsert rather than a create, because the row survives being unmarked:
   * `isCompleted` goes back to `false` and `completedAt` is cleared, so the
   * unique `(userId, lessonId)` pair is never duplicated and a learner
   * re-finishing a lesson updates the same row.
   */
  upsert(userId: string, lessonId: string, isCompleted: boolean) {
    const completedAt = isCompleted ? new Date() : null;

    return db.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, isCompleted, completedAt },
      update: { isCompleted, completedAt },
      select: { lessonId: true, isCompleted: true, completedAt: true },
    });
  },
};
