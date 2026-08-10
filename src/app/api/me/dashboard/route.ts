import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { studentService } from "@/services/student.service";

/**
 * `GET /api/me/dashboard` — the signed-in learner's own progress.
 *
 * `/me` rather than `/students/:id`: the subject of this endpoint is always
 * whoever holds the session. There is no id in the URL to tamper with, and the
 * Service is handed the user object the guard resolved — so it is not possible
 * to ask for someone else's dashboard.
 *
 * `requireUser()`, not `requireAdmin()`: this is the one part of the API that
 * students are supposed to reach.
 */
export async function GET() {
  try {
    const user = await authService.requireUser();

    return ok(await studentService.getDashboard(user));
  } catch (error) {
    return handleRouteError(error);
  }
}
