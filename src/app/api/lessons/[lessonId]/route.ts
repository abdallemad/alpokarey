import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { lessonService } from "@/services/lesson.service";
import { lessonUpdateSchema } from "@/validation/lesson.schema";

/** `/api/lessons/:lessonId` — read, update, and delete a single lesson. */

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/lessons/[lessonId]">,
) {
  try {
    await authService.requireAdmin();

    const { lessonId } = await context.params;

    return ok(await lessonService.getLesson(lessonId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/lessons/[lessonId]">,
) {
  try {
    await authService.requireAdmin();

    const { lessonId } = await context.params;
    const input = lessonUpdateSchema.parse(await request.json());

    return ok(await lessonService.updateLesson(lessonId, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/lessons/[lessonId]">,
) {
  try {
    await authService.requireAdmin();

    const { lessonId } = await context.params;

    return ok(await lessonService.deleteLesson(lessonId));
  } catch (error) {
    return handleRouteError(error);
  }
}
