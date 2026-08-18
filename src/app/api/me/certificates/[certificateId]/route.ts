import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { certificateService } from "@/services/certificate.service";

/**
 * `GET /api/me/certificates/:certificateId` — one certificate this learner
 * holds, with everything the document needs on it.
 *
 * The id in the URL narrows the search; it does not authorise it. The
 * repository query filters by `userId` as well, so asking for a certificate
 * belonging to someone else is a 404 — indistinguishable from an id that was
 * never real, which is what stops the endpoint being used to confirm that a
 * given certificate exists.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/me/certificates/[certificateId]">,
) {
  try {
    const user = await authService.requireUser();
    const { certificateId } = await context.params;

    return ok(await certificateService.getCertificate(user, certificateId));
  } catch (error) {
    return handleRouteError(error);
  }
}
