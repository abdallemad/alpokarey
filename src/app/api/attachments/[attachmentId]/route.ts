import type { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { lessonService } from "@/services/lesson.service";

/**
 * `DELETE /api/attachments/:attachmentId` — remove an attachment and, when it
 * is a file, the stored object behind it.
 *
 * Addressed by its own id rather than nested under the lesson: an attachment
 * id is unique on its own, and the client deleting one already has it.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/attachments/[attachmentId]">,
) {
  try {
    await authService.requireAdmin();

    const { attachmentId } = await context.params;

    return ok(await lessonService.removeAttachment(attachmentId));
  } catch (error) {
    return handleRouteError(error);
  }
}
