import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { userListQuerySchema } from "@/validation/user.schema";

/**
 * `GET /api/users` — the accounts list for the console.
 *
 * `requireAdmin()`, like every other admin read: a list of who studies here,
 * with their email addresses, is privileged whether or not anything is written.
 *
 * There is no `POST`. Accounts are created by Clerk and mirrored on sign-in —
 * see `docs/admin-access-control.md` §2 — so a create endpoint here would be a
 * second way to make a `User` row, and the two would disagree.
 */
export async function GET(request: NextRequest) {
  try {
    await authService.requireAdmin();

    const query = userListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    return ok(await userService.listUsers(query));
  } catch (error) {
    return handleRouteError(error);
  }
}
