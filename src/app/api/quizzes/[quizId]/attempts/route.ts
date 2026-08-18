import type { NextRequest } from "next/server";

import { created, handleRouteError } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { quizService } from "@/services/quiz.service";
import { quizAttemptSubmitSchema } from "@/validation/quiz.schema";

/**
 * `POST /api/quizzes/:quizId/attempts` — sit an exam.
 *
 * `requireUser()`, like the progress endpoint: an admin is also a learner, and
 * the attempt is always recorded against the session's own user. Nothing in the
 * request says who is answering.
 *
 * Returns `201` with the graded result — the score, the verdict, and a
 * per-question review. That review is the **only** place the correct answers
 * cross the wire, and only for an attempt already committed to the database.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/quizzes/[quizId]/attempts">,
) {
  try {
    const user = await authService.requireUser();

    const { quizId } = await context.params;
    const input = quizAttemptSubmitSchema.parse(await request.json());

    return created(await quizService.submitAttempt(user, quizId, input));
  } catch (error) {
    return handleRouteError(error);
  }
}
