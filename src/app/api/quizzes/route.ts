import type { NextRequest } from "next/server";

import { created, handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { quizService } from "@/services/quiz.service";
import {
  quizCreateSchema,
  quizListQuerySchema,
} from "@/validation/quiz.schema";

/**
 * `/api/quizzes` — the cross-stage exam collection.
 *
 * Top-level for the same reason `/api/lessons` is: the console lists every
 * exam in the academy and narrows with filters, so the parent arrives as
 * `stageId` — a filter when reading, a required field in the body when
 * creating.
 *
 * Routes stay thin on purpose: guard, parse, delegate, shape.
 */
export async function GET(request: NextRequest) {
  try {
    await authService.requireAdmin();

    const query = quizListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    return ok(await quizService.listQuizzes(query));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await authService.requireAdmin();

    const input = quizCreateSchema.parse(await request.json());

    return created(await quizService.createQuiz(input));
  } catch (error) {
    return handleRouteError(error);
  }
}
