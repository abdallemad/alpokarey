import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { learnService } from "@/services/learn.service";

/**
 * `GET /api/me/learn/:pathId/lessons/:lessonId` — one lesson, as a student
 * enrolled in that path sees it.
 *
 * Separate from the admin's `GET /api/lessons/:lessonId`, which is
 * `requireAdmin()`-guarded and returns editorial fields a learner has no use
 * for. Nesting it under the path is what lets the Service check that the lesson
 * really belongs to the curriculum the learner is enrolled in, rather than
 * trusting a lesson id on its own.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/me/learn/[pathId]/lessons/[lessonId]">,
) {
  try {
    const user = await authService.requireUser();
    const { pathId, lessonId } = await context.params;

    return ok(await learnService.getLesson(user, pathId, lessonId));
  } catch (error) {
    return handleRouteError(error);
  }
}
