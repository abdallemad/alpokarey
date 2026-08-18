import { db } from "@/lib/db";

/**
 * Data access for `Enrollment` — the row that says a learner is studying a
 * path, and how far along they are.
 *
 * `findByUserAndPath` is the gate the whole learning experience rests on: no
 * enrolment, no player. It is a `findUnique` on the `(userId, pathId)` pair, so
 * the check is an index lookup rather than a scan.
 */
export const enrollmentRepository = {
  findByUserAndPath(userId: string, pathId: string) {
    return db.enrollment.findUnique({
      where: { userId_pathId: { userId, pathId } },
      select: {
        id: true,
        progress: true,
        isCompleted: true,
        createdAt: true,
      },
    });
  },

  /**
   * Write the recomputed figures back onto the enrolment.
   *
   * The column exists and the admin console reads it, so leaving it stale is
   * what makes the two halves of the product disagree — see
   * `docs/student-dashboard.md` §12. Whether it *should* be written is the
   * Service's call, not this layer's.
   */
  updateProgress(
    enrollmentId: string,
    data: { progress: number; isCompleted: boolean },
  ) {
    return db.enrollment.update({
      where: { id: enrollmentId },
      data,
      select: { id: true, progress: true, isCompleted: true },
    });
  },
};
