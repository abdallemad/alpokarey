import type { PathCategory } from "@prisma/client";

/**
 * Certificates of completion — what a learner earns for finishing a path.
 *
 * `Certificate` in the schema is four columns: an id, a user, a path and a
 * date. Everything below it is that row plus the context needed to render it
 * as a document rather than a database record — who it names, what they
 * finished, and how much of it there was.
 *
 * Dates are ISO strings, not `Date`: JSON has no date type.
 *
 * See `docs/certificates-feature.md`.
 */

/**
 * Whether this learner may claim a certificate for this path, and why not.
 *
 * Returned by the player so the button in the header can be disabled with a
 * reason attached rather than silently inert. The **server decides this** — the
 * client renders the verdict, it does not compute one of its own, or the rule
 * would exist in two places and drift.
 */
export type CertificateEligibility = {
  /** `true` only when every other field here permits it and none is pending. */
  canIssue: boolean;
  /** The certificate already held for this path, if any. */
  certificateId: string | null;
  /** `Path.certificationActivated` — the admin's switch. */
  isCertificationActivated: boolean;
  /** Whether the path counts as finished, by the rule in the Service. */
  isPathCompleted: boolean;
  /** A path with no lessons cannot be completed, and says so separately. */
  hasLessons: boolean;
};

/** One certificate, ready to be rendered as a document. */
export type CertificateDetail = {
  id: string;
  issuedAt: string;
  /** The learner's name as it should appear on the certificate. */
  recipientName: string;
  path: {
    id: string;
    title: string;
    description: string | null;
    category: PathCategory | null;
  };
  /** How much curriculum the certificate stands for. */
  stagesCount: number;
  lessonsCount: number;
};
