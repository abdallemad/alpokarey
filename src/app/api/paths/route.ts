import type { NextRequest } from "next/server";

import { created, handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { pathService } from "@/services/path.service";
import {
  pathCreateSchema,
  pathListQuerySchema,
} from "@/validation/path.schema";

/**
 * `/api/paths` — the collection endpoint.
 *
 * Routes stay thin on purpose: parse the request, delegate to the Service,
 * shape the response. No business rules and no Prisma.
 */

export async function GET(request: NextRequest) {
  try {
    await authService.requireAdmin();

    const query = pathListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    return ok(await pathService.listPaths(query));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await authService.requireAdmin();

    const input = pathCreateSchema.parse(await request.json());

    return created(await pathService.createPath(input));
  } catch (error) {
    return handleRouteError(error);
  }
}
