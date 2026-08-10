import type { NextRequest } from "next/server";

import { created, handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { lessonService } from "@/services/lesson.service";
import {
  lessonCreateSchema,
  lessonListQuerySchema,
} from "@/validation/lesson.schema";

/**
 * `/api/lessons` — the cross-stage lesson collection.
 *
 * Top-level for the same reason `/api/stages` is: the console lists every
 * lesson in the academy and narrows with filters, so the parent arrives as
 * `stageId` — a filter when reading, a required field in the body when
 * creating.
 *
 * Routes stay thin on purpose: guard, parse, delegate, shape.
 */
export async function GET(request: NextRequest) {
  try {
    await authService.requireAdmin();

    const query = lessonListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    return ok(await lessonService.listLessons(query));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await authService.requireAdmin();

    const input = lessonCreateSchema.parse(await request.json());

    return created(await lessonService.createLesson(input));
  } catch (error) {
    return handleRouteError(error);
  }
}
