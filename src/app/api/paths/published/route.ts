import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { pathService } from "@/services/path.service";
import { publicPathsQuerySchema } from "@/validation/path.schema";

/**
 * `GET /api/paths/published` — the public catalog.
 *
 * **The only unauthenticated read in the whole API that takes a query.**
 * Everything else under `/api` is behind `requireAdmin()` or `requireUser()`;
 * this one has to be open, because its callers are the landing page's teaser
 * and `/paths` itself, both read by visitors who have no account yet — that is
 * the entire point of the pages they are on.
 *
 * It is a separate route from `GET /api/paths` rather than an unguarded branch
 * inside it. A single handler that sometimes checks a session is a handler that
 * eventually stops checking: here the guarded and unguarded reads are different
 * files, different Service methods and different response shapes, so neither
 * can quietly become the other.
 *
 * Four things keep it safe to leave open now that it **does** take parameters:
 *
 * - `pathRepository`'s `buildPublicWhere` hard-codes `status: "PUBLISHED"`, and
 *   there is no `status` field in the schema for a caller to send.
 * - Both filters are **closed enums** — a category outside `PathCategory` and a
 *   `certification` outside the tri-state are 422s, not queries.
 * - `pageSize` has a ceiling of 24, so the endpoint cannot be asked to dump the
 *   whole table.
 * - It returns `PublicPathSummary`, which has no editorial state and no
 *   enrolment figures on it.
 *
 * See `docs/tracks-catalog-feature.md`.
 */
export async function GET(request: NextRequest) {
  try {
    const query = publicPathsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    return ok(await pathService.listPublicPaths(query));
  } catch (error) {
    return handleRouteError(error);
  }
}
