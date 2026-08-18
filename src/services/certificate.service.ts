import { ConflictError, NotFoundError } from "@/lib/errors";
import { certificateRepository } from "@/repositories/certificate.repository";
import { learnRepository } from "@/repositories/learn.repository";
import { lessonProgressRepository } from "@/repositories/lesson-progress.repository";
import type { AppUser } from "@/repositories/user.repository";
import type { CertificateDetail } from "@/types/certificate";
import { requireEnrollment } from "@/services/learn.service";
import {
  toCertificateBlockReason,
  toCertificateEligibility,
} from "@/utils/certificate";
import {
  isPathComplete,
  reconcileProgress,
  toProgressPercent,
} from "@/utils/progress";
import { toDisplayName } from "@/utils/user";

/**
 * Business logic for issuing and reading certificates of completion.
 *
 * A certificate is the one thing in this product a learner **earns** rather
 * than merely accumulates, so three rules shape this module:
 *
 * 1. **The server decides eligibility, always.** The player disables its button
 *    using the verdict this Service already computed, but `issue()` recomputes
 *    the whole thing from the database before writing a row. A learner who
 *    calls the endpoint directly gets the same refusal the button was showing.
 * 2. **Issuing is idempotent.** `Certificate` is unique on `(userId, pathId)`,
 *    so a second request — a double click, a retried mutation, two tabs —
 *    returns the certificate already held instead of failing. The learner
 *    cannot tell the difference, which is the point.
 * 3. **Enrolment is still the gate**, checked through the very same
 *    `requireEnrollment` the rest of the learning experience uses.
 *
 * Knows nothing about HTTP — no `Request`, no `Response`.
 */

/**
 * How far through a path this learner is, by the same reconciliation the player
 * shows them.
 *
 * This is the load-bearing detail of the whole feature. `learnService` reports
 * a percentage that may come from `Enrollment.progress` rather than from the
 * lesson rows — see `utils/progress.ts` — and if the gate here counted only
 * ticked lessons, a learner looking at a 100% bar would press a button that
 * answered "you have not finished". The gate reads the figure the learner is
 * actually looking at.
 */
async function resolveCompletion(
  userId: string,
  pathId: string,
  enrollment: { progress: number; isCompleted: boolean },
) {
  const lessonIds = await learnRepository.findLessonIdsByPath(pathId);
  const completedIds = await lessonProgressRepository.findCompletedIds(
    userId,
    lessonIds,
  );

  const { progress } = reconcileProgress(
    toProgressPercent(completedIds.length, lessonIds.length),
    enrollment.progress,
  );

  return {
    lessonsCount: lessonIds.length,
    isPathCompleted: isPathComplete({
      enrollmentIsCompleted: enrollment.isCompleted,
      lessonsCount: lessonIds.length,
      progress,
    }),
  };
}

/** The stored row, dressed as the document the certificate page renders. */
async function toDetail(
  certificateId: string,
  userId: string,
): Promise<CertificateDetail> {
  const row = await certificateRepository.findByIdForUser(certificateId, userId);

  // Not found rather than forbidden: a certificate belonging to someone else
  // and a certificate that does not exist should be indistinguishable, or the
  // 403 itself becomes a way to confirm an id is real.
  if (!row) {
    throw new NotFoundError("الشهادة المطلوبة غير موجودة");
  }

  const lessonsCount = await certificateRepository.countLessonsByPath(
    row.path.id,
  );

  return {
    id: row.id,
    issuedAt: row.issuedAt.toISOString(),
    recipientName: toDisplayName(row.user),
    path: {
      id: row.path.id,
      title: row.path.title,
      description: row.path.description,
      category: row.path.category,
    },
    stagesCount: row.path._count.stages,
    lessonsCount,
  };
}

export const certificateService = {
  /**
   * Issue the certificate for a path, or hand back the one already issued.
   *
   * The order of the checks is deliberate: enrolment first (it is the gate on
   * every read in this feature), then existence of the path, then the existing
   * certificate — so the common case of a learner clicking a button that should
   * have said "view" costs three index lookups and no completion arithmetic.
   */
  async issue(user: AppUser, pathId: string): Promise<CertificateDetail> {
    const enrollment = await requireEnrollment(user.id, pathId);

    const path = await certificateRepository.findPathForIssuing(pathId);

    if (!path) {
      throw new NotFoundError("المسار المطلوب غير موجود");
    }

    const existing = await certificateRepository.findByUserAndPath(
      user.id,
      pathId,
    );

    if (existing) {
      return toDetail(existing.id, user.id);
    }

    const { lessonsCount, isPathCompleted } = await resolveCompletion(
      user.id,
      pathId,
      enrollment,
    );

    const eligibility = toCertificateEligibility({
      certificateId: null,
      isCertificationActivated: path.certificationActivated,
      lessonsCount,
      isPathCompleted,
    });

    if (!eligibility.canIssue) {
      // 409 rather than 403: nothing about *who* is asking is wrong — the path
      // is simply not in a state where a certificate exists to be given yet.
      throw new ConflictError(
        toCertificateBlockReason(eligibility) ??
          "لا يمكن إصدار الشهادة لهذا المسار حاليًا.",
      );
    }

    // `createOrGet`, not `create`: two requests can both pass the `existing`
    // check above and arrive here together — a double click is the ordinary way
    // that happens. The repository resolves the race on the unique constraint,
    // so the loser gets the winner's certificate rather than an error, which
    // from the learner's side is simply the one click they made.
    const certificate = await certificateRepository.createOrGet(
      user.id,
      pathId,
    );

    return toDetail(certificate.id, user.id);
  },

  /** One certificate the signed-in learner holds. */
  getCertificate(
    user: AppUser,
    certificateId: string,
  ): Promise<CertificateDetail> {
    return toDetail(certificateId, user.id);
  },
};
