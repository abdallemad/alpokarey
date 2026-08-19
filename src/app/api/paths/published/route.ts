import { handleRouteError, ok } from "@/lib/api-response";
import { pathService } from "@/services/path.service";

/**
 * `GET /api/paths/published` — the public catalog.
 *
 * **The only unauthenticated read in the whole API.** Everything else under
 * `/api` is behind `requireAdmin()` or `requireUser()`; this one has to be
 * open, because its caller is a visitor on the landing page who has no account
 * yet — that is the entire point of the page they are on.
 *
 * It is a separate route from `GET /api/paths` rather than an unguarded branch
 * inside it. A single handler that sometimes checks a session is a handler that
 * eventually stops checking: here the guarded and unguarded reads are different
 * files, different Service methods and different response shapes, so neither
 * can quietly become the other.
 *
 * Three things keep it safe to leave open:
 *
 * - It takes **no parameters**. There is no filter, no page size and no id, so
 *   there is nothing to tamper with.
 * - `pathRepository.findPublished` hard-codes `status: "PUBLISHED"`, so no
 *   caller can reach a draft.
 * - It returns `PublicPathSummary`, which has no editorial state and no
 *   enrolment figures on it.
 */
export async function GET() {
  try {
    return ok(await pathService.listPublishedPaths());
  } catch (error) {
    return handleRouteError(error);
  }
}
