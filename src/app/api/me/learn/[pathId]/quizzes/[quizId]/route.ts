import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { learnService } from "@/services/learn.service";

/**
 * `GET /api/me/learn/:pathId/quizzes/:quizId` — one exam, ready to be taken.
 *
 * **Not** the admin's `GET /api/quizzes/:quizId`. That route returns each
 * option's `isCorrect`, which is correct for the editor and would be the answer
 * key in the page source here. This one is served by a select that has no such
 * field to return — see `repositories/learn.repository.ts`.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/me/learn/[pathId]/quizzes/[quizId]">,
) {
  try {
    const user = await authService.requireUser();
    const { pathId, quizId } = await context.params;

    return ok(await learnService.getQuiz(user, pathId, quizId));
  } catch (error) {
    return handleRouteError(error);
  }
}
