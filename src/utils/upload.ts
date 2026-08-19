import { STORAGE_PATH_PATTERN, UPLOAD_URL_PREFIX } from "@/constants/upload";

/**
 * Reading a stored URL back.
 *
 * `lib/storage.ts` writes objects under `public/uploads` and hands back
 * `/uploads/<key>`, but what gets **saved** on a record is only that URL —
 * `Path.imageUrl` has no companion key column the way `Attachment` does. These
 * two functions are how the rest of the app asks "is this ours?" and "which
 * object is it?" without every caller re-deriving the shape.
 *
 * Pure, no React and no filesystem — so the Zod schema, the Service and a
 * Client Component all read the same answer. See `docs/path-cover-images.md`.
 */

/**
 * Whether a value is an object this app stored, rather than a link elsewhere.
 *
 * Deliberately strict: `STORAGE_PATH_PATTERN` allows exactly one path segment
 * after the prefix and no leading dot, so `/uploads/../../etc/passwd` is not a
 * stored path and never reaches `storage.remove()` through `toStorageKey`.
 */
export function isStoredUploadPath(value: string | null | undefined): boolean {
  return typeof value === "string" && STORAGE_PATH_PATTERN.test(value);
}

/**
 * The storage key behind a stored URL, or `null` for anything else.
 *
 * `null` is the important half: an absolute Cloudinary link is not this app's
 * object to delete, and returning `null` for it is what stops a cleanup pass
 * from trying.
 */
export function toStorageKey(value: string | null | undefined): string | null {
  if (!isStoredUploadPath(value)) return null;

  return (value as string).slice(UPLOAD_URL_PREFIX.length + 1);
}
