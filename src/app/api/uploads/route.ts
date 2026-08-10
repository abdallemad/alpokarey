import type { NextRequest } from "next/server";

import { created, handleRouteError } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";
import { storage } from "@/lib/storage";
import { authService } from "@/services/auth.service";

/**
 * `POST /api/uploads` — put a file into storage and return where it landed.
 *
 * Deliberately generic: it knows nothing about lessons or attachments, so the
 * same endpoint serves a path cover image or a certificate asset later. The
 * caller records the returned `key` and `url` wherever they belong.
 *
 * Admin-guarded like everything else in the console — an open upload endpoint
 * is an open file host.
 *
 * Size, type allowlist and the generated object name are all enforced by
 * `lib/storage.ts`, which throws `ValidationError` (422) for a rejected file.
 */
export async function POST(request: NextRequest) {
  try {
    await authService.requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ValidationError("لم يتم إرسال ملف");
    }

    return created(await storage.save(file));
  } catch (error) {
    return handleRouteError(error);
  }
}
