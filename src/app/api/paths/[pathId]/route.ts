import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { pathService } from "@/services/path.service";
import { pathUpdateSchema } from "@/validation/path.schema";

/** `/api/paths/:pathId` — read, update, and delete a single path. */

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/paths/[pathId]">,
) {
  try {
    await authService.requireAdmin();

    const { pathId } = await context.params;

    return ok(await pathService.getPath(pathId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/paths/[pathId]">,
) {
  try {
    await authService.requireAdmin();

    const { pathId } = await context.params;
    const input = pathUpdateSchema.parse(await request.json());

    return ok(await pathService.updatePath(pathId, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/paths/[pathId]">,
) {
  try {
    await authService.requireAdmin();

    const { pathId } = await context.params;

    return ok(await pathService.deletePath(pathId));
  } catch (error) {
    return handleRouteError(error);
  }
}
