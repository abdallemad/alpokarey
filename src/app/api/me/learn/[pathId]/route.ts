import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { learnService } from "@/services/learn.service";

/**
 * `GET /api/me/learn/:pathId` — the curriculum of one path, with this
 * learner's progress through it.
 *
 * Under `/me` for the same reason as the dashboard and the path list: the
 * subject is always whoever holds the session. The path id in the URL says
 * *which* curriculum, never *whose* progress — that comes from the guard.
 *
 * This is the payload the player's sidebar renders: every stage, its lessons,
 * each lesson's exam and the stage's final, in study order.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/me/learn/[pathId]">,
) {
  try {
    const user = await authService.requireUser();
    const { pathId } = await context.params;

    return ok(await learnService.getCurriculum(user, pathId));
  } catch (error) {
    return handleRouteError(error);
  }
}
