import { NotFoundError } from "@/lib/errors";
import { enrollmentRepository } from "@/repositories/enrollment.repository";
import { learnRepository } from "@/repositories/learn.repository";
import { lessonProgressRepository } from "@/repositories/lesson-progress.repository";
import type { AppUser } from "@/repositories/user.repository";
import type { LessonProgressResult } from "@/types/learn";
import { requireEnrollment } from "@/services/learn.service";
import { toPercent, toProgressPercent } from "@/utils/progress";

/**
 * Business logic for recording that a learner finished a lesson.
 *
 * This is the endpoint every other progress figure in the product has been
 * waiting for. Until now `LessonProgress` rows existed but nothing wrote them
 * from the app, and `Enrollment.progress` was never maintained at all — see
 * `docs/student-dashboard.md` §12. Both are written here.
 */

/**
 * How the stored column is allowed to move.
 *
 * `Enrollment.progress` is a **high-water mark**, not a mirror of the lesson
 * rows. It only ever goes up.
 *
 * That is not tidiness, it is the only safe rule available. Most enrolments in
 * the database carry a percentage recorded before per-lesson tracking existed,
 * with no `LessonProgress` rows to account for it: a learner sitting at a
 * stored 67% with zero completed lessons would be reset to 0% the first time
 * they touched a checkbox. Nothing in the schema distinguishes "67% from the
 * old system" from "67% this endpoint wrote", so the column is never lowered.
 *
 * The visible cost is that un-marking a lesson does not pull the headline
 * percentage back down — the tick disappears from the sidebar, the number
 * stays. A one-off backfill of `Enrollment.progress` from `LessonProgress`
 * would make it safe to turn this into a plain assignment.
 */
function toStoredProgress(computed: number, stored: number): number {
  return Math.max(computed, toPercent(stored));
}

export const progressService = {
  /**
   * Mark a lesson complete, or take it back, and bring the enrolment with it.
   *
   * The lesson id alone is enough: the path is resolved from it and the
   * enrolment checked against that, so a learner cannot record progress in a
   * curriculum they never enrolled in by posting an id they found elsewhere.
   */
  async setLessonProgress(
    user: AppUser,
    lessonId: string,
    isCompleted: boolean,
  ): Promise<LessonProgressResult> {
    const lesson = await learnRepository.findLessonPath(lessonId);

    if (!lesson) {
      throw new NotFoundError("الدرس المطلوب غير موجود");
    }

    const pathId = lesson.stage.pathId;
    const enrollment = await requireEnrollment(user.id, pathId);

    const progress = await lessonProgressRepository.upsert(
      user.id,
      lessonId,
      isCompleted,
    );

    // Recomputed from the rows rather than nudged by one: the alternative is a
    // counter that drifts every time a lesson is added, removed, or completed
    // in a second tab.
    const lessonIds = await learnRepository.findLessonIdsByPath(pathId);
    const completedIds = await lessonProgressRepository.findCompletedIds(
      user.id,
      lessonIds,
    );

    const computedProgress = toProgressPercent(
      completedIds.length,
      lessonIds.length,
    );
    const storedProgress = toStoredProgress(
      computedProgress,
      enrollment.progress,
    );
    const pathIsCompleted =
      enrollment.isCompleted || (lessonIds.length > 0 && storedProgress === 100);

    // Only write when something actually changed. Un-marking a lesson on a path
    // whose stored figure is already higher is a no-op for the enrolment, and a
    // pointless `UPDATE` would still bump `updatedAt`.
    if (
      storedProgress !== enrollment.progress ||
      pathIsCompleted !== enrollment.isCompleted
    ) {
      await enrollmentRepository.updateProgress(enrollment.id, {
        progress: storedProgress,
        isCompleted: pathIsCompleted,
      });
    }

    return {
      lessonId: progress.lessonId,
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt?.toISOString() ?? null,
      pathId,
      pathProgress: storedProgress,
      pathIsCompleted,
      // The tick count, not the reconciled one: this is what the sidebar shows,
      // and the caller uses it to confirm the click landed.
      completedLessonsCount: completedIds.length,
      lessonsCount: lessonIds.length,
    };
  },
};
