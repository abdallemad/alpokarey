import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { studentService } from "@/services/student.service";
import { enrolledPathsQuerySchema } from "@/validation/student.schema";

/**
 * `GET /api/me/paths` — the paths the signed-in learner is enrolled in, with
 * their progress in each.
 *
 * Under `/me` for the same reason as the dashboard: the subject is always
 * whoever holds the session, so there is no id in the URL to tamper with and
 * the Service is handed the user object the guard resolved.
 *
 * Separate from `/api/me/dashboard` even though both read enrolments, because a
 * learner landing straight on `/paths` should not also pay for the attempt and
 * certificate lists that page never renders — and because the filter and sort
 * rules are contract, which the future mobile client gets for free here.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authService.requireUser();
    const query = enrolledPathsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    return ok(await studentService.getEnrolledPaths(user, query));
  } catch (error) {
    return handleRouteError(error);
  }
}
