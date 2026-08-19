import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { userRoleUpdateSchema } from "@/validation/user.schema";

/**
 * `/api/users/:userId` — one account, and the single field an admin may change.
 *
 * Both handlers are guarded by `requireAdmin()` and both pass the **actor**
 * into the Service. The actor is not a filter — an admin may read any account —
 * it is what lets the Service answer "is this row you?", which decides whether
 * the role control is offered at all. Deciding it server-side means the button
 * the UI renders and the rule the endpoint enforces cannot drift apart.
 *
 * There is no `DELETE`. Deleting a `User` cascades to enrolments, lesson
 * progress, attempts and certificates — a learner's entire history — and the
 * account itself belongs to Clerk, so a row deleted here would come back on
 * their next sign-in. Removing someone is a Clerk-side action.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/users/[userId]">,
) {
  try {
    const actor = await authService.requireAdmin();

    const { userId } = await context.params;

    return ok(await userService.getUser(actor, userId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/users/[userId]">,
) {
  try {
    const actor = await authService.requireAdmin();

    const { userId } = await context.params;
    const { role } = userRoleUpdateSchema.parse(await request.json());

    return ok(await userService.updateRole(actor, userId, role));
  } catch (error) {
    return handleRouteError(error);
  }
}
