import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { quizService } from "@/services/quiz.service";
import { quizUpdateSchema } from "@/validation/quiz.schema";

/** `/api/quizzes/:quizId` — read, update, and delete a single exam. */

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/quizzes/[quizId]">,
) {
  try {
    await authService.requireAdmin();

    const { quizId } = await context.params;

    return ok(await quizService.getQuiz(quizId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/quizzes/[quizId]">,
) {
  try {
    await authService.requireAdmin();

    const { quizId } = await context.params;
    const input = quizUpdateSchema.parse(await request.json());

    return ok(await quizService.updateQuiz(quizId, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/quizzes/[quizId]">,
) {
  try {
    await authService.requireAdmin();

    const { quizId } = await context.params;

    return ok(await quizService.deleteQuiz(quizId));
  } catch (error) {
    return handleRouteError(error);
  }
}
