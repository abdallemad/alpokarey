import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { stageService } from "@/services/stage.service";
import { stageUpdateSchema } from "@/validation/stage.schema";

/** `/api/stages/:stageId` — read, update, and delete a single stage. */

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/stages/[stageId]">,
) {
  try {
    await authService.requireAdmin();

    const { stageId } = await context.params;

    return ok(await stageService.getStage(stageId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/stages/[stageId]">,
) {
  try {
    await authService.requireAdmin();

    const { stageId } = await context.params;
    const input = stageUpdateSchema.parse(await request.json());

    return ok(await stageService.updateStage(stageId, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/stages/[stageId]">,
) {
  try {
    await authService.requireAdmin();

    const { stageId } = await context.params;

    return ok(await stageService.deleteStage(stageId));
  } catch (error) {
    return handleRouteError(error);
  }
}
