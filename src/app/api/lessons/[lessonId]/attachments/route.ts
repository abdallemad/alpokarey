import type { NextRequest } from "next/server";

import { created, handleRouteError } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { lessonService } from "@/services/lesson.service";
import { attachmentCreateSchema } from "@/validation/lesson.schema";

/**
 * `POST /api/lessons/:lessonId/attachments` — attach a file or a note.
 *
 * This takes JSON, not multipart. Uploading the bytes is a separate step
 * (`POST /api/uploads`) because the two concerns are genuinely different: one
 * moves a file into storage and knows nothing about lessons, the other records
 * a row and knows nothing about bytes. Keeping them apart is what lets a
 * `TEXT` attachment — a summary, a transcript — reuse this endpoint untouched,
 * and lets the upload endpoint be reused for anything else later.
 *
 * The client chains the two, so it is still one action for the admin.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/lessons/[lessonId]/attachments">,
) {
  try {
    await authService.requireAdmin();

    const { lessonId } = await context.params;
    const input = attachmentCreateSchema.parse(await request.json());

    return created(await lessonService.addAttachment(lessonId, input));
  } catch (error) {
    return handleRouteError(error);
  }
}
