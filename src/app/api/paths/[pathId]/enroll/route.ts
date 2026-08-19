import type { NextRequest } from "next/server";

import { created, handleRouteError } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { enrollmentService } from "@/services/enrollment.service";
import { pathIdParamSchema } from "@/validation/path.schema";

/**
 * `POST /api/paths/:pathId/enroll` — join a path.
 *
 * **No request body.** The path comes from the URL and the learner comes from
 * the session, so there is nothing left for a caller to supply — and nothing
 * to tamper with. That is why there is no `enrollment.schema.ts`: the only
 * input is the id in the path, validated with the shared `pathIdParamSchema`.
 *
 * `requireUser()`, not `requireAdmin()` — enrolling is the learner's own act,
 * and an admin is also a learner. Whether they *may* enrol in this particular
 * path is a question about the path's publication state, decided in the
 * Service, which re-reads the database rather than trusting the caller.
 *
 * Always `201`, including when the learner was already enrolled: the Service is
 * idempotent, and reporting a different status for the second click of the same
 * button would only make the client handle a distinction it does not care
 * about. The `isNew` flag in the body carries that nuance for the toast — the
 * same choice `POST /api/me/certificates` made.
 */
export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/paths/[pathId]/enroll">,
) {
  try {
    const user = await authService.requireUser();
    const { pathId } = pathIdParamSchema.parse(await context.params);

    return created(await enrollmentService.enroll(user, pathId));
  } catch (error) {
    return handleRouteError(error);
  }
}
