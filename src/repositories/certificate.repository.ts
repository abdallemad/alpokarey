import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Data access for `Certificate` — the row that says a learner finished a path.
 *
 * Every read here takes a `userId` and filters by it, like
 * `student.repository.ts` and `lesson-progress.repository.ts`. There is no
 * "find by id" that spans learners, so a caller cannot serve one person another
 * person's certificate even by mistake — the id in the URL narrows the search,
 * it does not authorise it.
 */

const certificateDetailSelect = {
  id: true,
  issuedAt: true,
  user: { select: { name: true, email: true } },
  path: {
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      // Counted rather than loaded: the certificate says how much curriculum it
      // stands for, and pulling every lesson row to call `.length` on it would
      // move the whole path across the wire for two numbers.
      _count: { select: { stages: true } },
    },
  },
} satisfies Prisma.CertificateSelect;

export type CertificateDetailRow = Prisma.CertificateGetPayload<{
  select: typeof certificateDetailSelect;
}>;

export const certificateRepository = {
  /**
   * The certificate this learner holds for this path, if any.
   *
   * A `findUnique` on the `(userId, pathId)` pair the schema already enforces,
   * so the check the issue path makes first is an index lookup.
   */
  findByUserAndPath(userId: string, pathId: string) {
    return db.certificate.findUnique({
      where: { userId_pathId: { userId, pathId } },
      select: { id: true, issuedAt: true, pathId: true },
    });
  },

  /**
   * One certificate, scoped to its owner.
   *
   * `findFirst` with both ids rather than `findUnique` on the id alone: the
   * ownership check is part of the query instead of something the Service has
   * to remember to do afterwards. A certificate belonging to someone else is
   * simply not found.
   */
  findByIdForUser(certificateId: string, userId: string) {
    return db.certificate.findFirst({
      where: { id: certificateId, userId },
      select: certificateDetailSelect,
    });
  },

  /**
   * Just enough of a path to decide whether it may be certified.
   *
   * `pathRepository.findSummary` is the nearest existing read and it does not
   * carry `certificationActivated` — adding it there would widen a select four
   * other guards rely on for the sake of one caller, so this feature asks for
   * exactly what it needs.
   */
  findPathForIssuing(pathId: string) {
    return db.path.findUnique({
      where: { id: pathId },
      select: { id: true, title: true, certificationActivated: true },
    });
  },

  /**
   * Create the certificate, or hand back the one that already exists.
   *
   * An `upsert` with an empty `update` rather than a `create`, for the same
   * reason `lessonProgressRepository.upsert` is one: `(userId, pathId)` is
   * unique, and two requests that both got past the Service's "does one exist?"
   * check — a double click, a retried mutation, two open tabs — would otherwise
   * have the loser crash on the constraint.
   *
   * Doing it here rather than catching `P2002` in the Service keeps Prisma out
   * of the layer above, and makes the whole thing a single atomic statement
   * instead of a read, a write and a recovery path.
   *
   * `update: {}` changes nothing, so the original `issuedAt` survives: a
   * learner who clicks twice does not get their certificate re-dated.
   */
  createOrGet(userId: string, pathId: string) {
    return db.certificate.upsert({
      where: { userId_pathId: { userId, pathId } },
      create: { userId, pathId },
      update: {},
      select: { id: true, issuedAt: true, pathId: true },
    });
  },

  /** How many lessons the path holds, for the figure printed on the document. */
  countLessonsByPath(pathId: string) {
    return db.lesson.count({ where: { stage: { pathId } } });
  },
};
