import type { NextRequest } from "next/server";

import { created, handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { stageService } from "@/services/stage.service";
import {
  stageCreateSchema,
  stageListQuerySchema,
} from "@/validation/stage.schema";

/**
 * `/api/stages` — the cross-path stage collection.
 *
 * `folder-structure.md` sketches stages as `/api/paths/:pathId/stages`, which
 * stays the right home for *creating* a stage: a stage cannot exist without a
 * parent. Reading, though, is a different question — the console lists every
 * stage in the academy and filters down to one path — so the collection lives
 * at the top level and takes `pathId` as a filter.
 *
 * `POST` follows the same reasoning: the parent arrives as `pathId` in the
 * body — validated as a required uuid — instead of as a URL segment, so the
 * collection has one address for both reading and writing.
 *
 * Routes stay thin on purpose: guard, parse, delegate, shape.
 */
export async function GET(request: NextRequest) {
  try {
    await authService.requireAdmin();

    const query = stageListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    return ok(await stageService.listStages(query));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await authService.requireAdmin();

    const input = stageCreateSchema.parse(await request.json());

    return created(await stageService.createStage(input));
  } catch (error) {
    return handleRouteError(error);
  }
}
