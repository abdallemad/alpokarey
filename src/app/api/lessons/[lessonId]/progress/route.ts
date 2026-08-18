import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { progressService } from "@/services/progress.service";
import { lessonProgressSchema } from "@/validation/lesson.schema";

/**
 * `POST /api/lessons/:lessonId/progress` — mark a lesson complete, or undo it.
 *
 * Guarded by `requireUser()`, not `requireAdmin()`: this is the one write under
 * `/api/lessons` a student performs. There is no user id in the URL or the body
 * — the row is always written for whoever holds the session, and the Service
 * checks that they are enrolled in the path the lesson belongs to.
 *
 * A POST rather than a PUT because the body is an intent (`isCompleted`) rather
 * than a full representation of the row, and the same call is what the future
 * mobile client will make.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/lessons/[lessonId]/progress">,
) {
  try {
    const user = await authService.requireUser();

    const { lessonId } = await context.params;
    const { isCompleted } = lessonProgressSchema.parse(await request.json());

    return ok(
      await progressService.setLessonProgress(user, lessonId, isCompleted),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
