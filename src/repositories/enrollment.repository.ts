import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Data access for `Enrollment` — the row that says a learner is studying a
 * path, and how far along they are.
 *
 * `findByUserAndPath` is the gate the whole learning experience rests on: no
 * enrolment, no player. It is a `findUnique` on the `(userId, pathId)` pair, so
 * the check is an index lookup rather than a scan.
 *
 * Enrolling itself is an `upsert`, not a `create` — see `upsert` below.
 */

/**
 * The enrolment as every caller here reads it.
 *
 * One shape shared by the read and the write, so a Service handed an enrolment
 * cannot tell — and does not have to care — whether it just created it or found
 * it already there.
 */
const enrollmentSelect = {
  id: true,
  progress: true,
  isCompleted: true,
  createdAt: true,
} satisfies Prisma.EnrollmentSelect;

export type EnrollmentRow = Prisma.EnrollmentGetPayload<{
  select: typeof enrollmentSelect;
}>;

export const enrollmentRepository = {
  findByUserAndPath(userId: string, pathId: string) {
    return db.enrollment.findUnique({
      where: { userId_pathId: { userId, pathId } },
      select: enrollmentSelect,
    });
  },

  /**
   * Enrol this learner in this path, or hand back the enrolment already there.
   *
   * An `upsert` rather than a `create`, with an **empty `update`**. The unique
   * `(userId, pathId)` index is what makes enrolling idempotent, and doing it in
   * one statement is what makes it safe: a double-clicked button fires two
   * requests that race, and a `create` would lose that race with a unique-
   * constraint violation surfacing to the learner as a 500.
   *
   * `update: {}` matters just as much. A second enrolment must not reset
   * `progress` — a learner returning to the path page after finishing half of
   * it, and pressing a button a stale cache still labelled "التسجيل", would
   * otherwise erase their own history with it.
   */
  upsert(userId: string, pathId: string) {
    return db.enrollment.upsert({
      where: { userId_pathId: { userId, pathId } },
      create: { userId, pathId },
      update: {},
      select: enrollmentSelect,
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
