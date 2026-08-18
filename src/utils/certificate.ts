import type { CertificateEligibility } from "@/types/certificate";

/**
 * The one rule that decides whether a certificate may be issued.
 *
 * A pure function over numbers and booleans, with no database and no React, so
 * that the player's button and the endpoint behind it are answering the same
 * question rather than two questions that happen to agree today. The player
 * reads it through `learnService.getCurriculum`; the write path reads it again
 * in `certificateService.issue` before creating anything — the client's copy
 * decides what the button looks like, never whether the row is written.
 *
 * See `docs/certificates-feature.md` §3.
 */

export type CertificateEligibilityInput = {
  /** An existing certificate for this path, if the learner already holds one. */
  certificateId: string | null;
  /** `Path.certificationActivated` — the admin's switch for this path. */
  isCertificationActivated: boolean;
  /** How many lessons the path holds. */
  lessonsCount: number;
  /** Whether the path counts as finished — see `isPathComplete`. */
  isPathCompleted: boolean;
};

export function toCertificateEligibility(
  input: CertificateEligibilityInput,
): CertificateEligibility {
  const hasLessons = input.lessonsCount > 0;

  return {
    // Already holding one is not an error, but it is not a reason to issue a
    // second: the schema's `(userId, pathId)` unique says there is only ever
    // one certificate per path, so the button switches to "view" instead.
    canIssue:
      input.certificateId === null &&
      input.isCertificationActivated &&
      hasLessons &&
      input.isPathCompleted,
    certificateId: input.certificateId,
    isCertificationActivated: input.isCertificationActivated,
    isPathCompleted: input.isPathCompleted,
    hasLessons,
  };
}

/**
 * Why the certificate cannot be claimed, in the order the learner should hear
 * it — or `null` when it can.
 *
 * Shared by the disabled button's tooltip and the endpoint's 409 body, so a
 * learner who defeats the disabled state gets the same sentence back rather
 * than a generic refusal.
 */
export function toCertificateBlockReason(
  eligibility: CertificateEligibility,
): string | null {
  if (eligibility.certificateId !== null) return null;

  if (!eligibility.isCertificationActivated) {
    return "لم تُفعَّل شهادة هذا المسار.";
  }

  if (!eligibility.hasLessons) {
    return "لا يمكن إصدار شهادة لمسار لا يحتوي على دروس.";
  }

  if (!eligibility.isPathCompleted) {
    return "أكمل جميع دروس المسار للحصول على الشهادة.";
  }

  return null;
}
