import { z } from "zod";

/**
 * What `POST /api/me/certificates` accepts.
 *
 * A path id and nothing else. There is deliberately no `userId` in the body:
 * the recipient is always whoever holds the session, resolved by the guard, so
 * there is no field here to tamper with — the same shape as every other `/me`
 * endpoint.
 *
 * The eligibility rules are **not** expressed here. Zod validates that the
 * request is well-formed; whether the learner has earned the certificate is a
 * question about the database, and it belongs to
 * `services/certificate.service.ts`.
 */
export const issueCertificateSchema = z.object({
  pathId: z.uuid("معرّف المسار غير صالح"),
});

export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;
