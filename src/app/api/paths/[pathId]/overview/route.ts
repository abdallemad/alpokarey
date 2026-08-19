import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { pathService } from "@/services/path.service";
import { pathIdParamSchema } from "@/validation/path.schema";

/**
 * `GET /api/paths/:pathId/overview` — one path as its public page shows it.
 *
 * **The only read in the API that serves both a visitor and a learner.**
 * Everything else is behind `requireAdmin()` or `requireUser()`; this one uses
 * `getCurrentUser()`, which returns `null` rather than throwing, because the
 * caller may legitimately have no account yet — that is the audience the page
 * exists to convert.
 *
 * It is a separate segment from `GET /api/paths/:pathId` rather than a branch
 * inside it, for the same reason `/api/paths/published` is separate from
 * `/api/paths`: the sibling above is `requireAdmin()`-only and returns
 * editorial state, and a single handler that sometimes checks a session is a
 * handler that eventually stops checking. Two files, two guards, two response
 * shapes — neither can quietly become the other.
 *
 * What keeps it safe to leave open:
 *
 * - The session is **read, never taken from the request**. There is no user id
 *   in the URL or the query, so `viewer` can only ever describe whoever holds
 *   the cookie.
 * - It returns `PathOverview`, which carries no editorial state, no enrolment
 *   totals, and no lesson content — titles and durations only.
 * - A path that is not published 404s for anyone not already enrolled in it,
 *   decided in `pathService.getPathOverview`.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/paths/[pathId]/overview">,
) {
  try {
    const user = await authService.getCurrentUser();
    const { pathId } = pathIdParamSchema.parse(await context.params);

    return ok(await pathService.getPathOverview(pathId, user));
  } catch (error) {
    return handleRouteError(error);
  }
}
