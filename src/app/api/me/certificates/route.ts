import type { NextRequest } from "next/server";

import { created, handleRouteError } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { certificateService } from "@/services/certificate.service";
import { issueCertificateSchema } from "@/validation/certificate.schema";

/**
 * `POST /api/me/certificates` — claim the certificate for a finished path.
 *
 * Under `/me` like the dashboard and the player: the recipient is always
 * whoever holds the session. The body names the *path*, never the person, so
 * there is no id here that could issue someone else a certificate.
 *
 * `requireUser()`, not `requireAdmin()` — earning a certificate is the
 * learner's own act. Everything about whether they have earned it is decided in
 * the Service, which re-reads the database rather than trusting the caller.
 *
 * Always `201`, including when the learner already held the certificate: the
 * Service is idempotent, and reporting a different status for the second click
 * of the same button would only make the client handle a distinction it does
 * not care about.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authService.requireUser();
    const { pathId } = issueCertificateSchema.parse(await request.json());

    return created(await certificateService.issue(user, pathId));
  } catch (error) {
    return handleRouteError(error);
  }
}
