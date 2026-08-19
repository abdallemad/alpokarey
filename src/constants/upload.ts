/**
 * Upload limits, shared by the server that enforces them and the file input
 * that advertises them.
 *
 * This lives in `constants/` rather than in `lib/storage.ts` precisely so the
 * client can import it: `storage.ts` reaches for `node:fs` and `node:crypto`,
 * and pulling that into a Client Component would break the build.
 */

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Public path prefix the storage driver serves objects from. */
export const UPLOAD_URL_PREFIX = "/uploads";

/**
 * Shape of a storage object key: a generated UUID plus an extension — one path
 * segment, never starting with a dot.
 *
 * Shared by the schema that accepts a key from the client and the driver that
 * turns one back into a filename, so `..` and nested segments are rejected
 * before they ever reach the filesystem.
 */
const STORAGE_KEY_BODY = "[A-Za-z0-9][A-Za-z0-9._-]*";

export const STORAGE_KEY_PATTERN = new RegExp(`^${STORAGE_KEY_BODY}$`);

/** The same key as a served path: what `storage.save()` returns as `url`. */
export const STORAGE_PATH_PATTERN = new RegExp(
  `^${UPLOAD_URL_PREFIX}/${STORAGE_KEY_BODY}$`,
);

/**
 * Allowlist, not a blocklist. The stored file's extension is derived from this
 * map rather than from the client-supplied filename, so an uploaded `.svg` or
 * `.html` cannot be talked into being served as an executable document.
 */
export const UPLOAD_MIME_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "video/mp4": "mp4",
  "text/plain": "txt",
  "application/zip": "zip",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
};

/** For a file input's `accept` attribute. */
export const ALLOWED_UPLOAD_MIME_TYPES =
  Object.keys(UPLOAD_MIME_EXTENSIONS).join(",");

/**
 * The image half of the allowlist, for fields that accept **only** a picture —
 * a path's cover image today.
 *
 * Derived from `UPLOAD_MIME_EXTENSIONS` by filtering rather than written out
 * again: a second list is a second place to add a format, and the one the
 * server enforces would not be it. Note what filtering excludes for free —
 * `image/svg+xml` is not in the allowlist at all, because an SVG is a document
 * that can carry script, and this driver serves what it stores from the app's
 * own origin.
 */
export const IMAGE_UPLOAD_MIME_TYPES = Object.keys(
  UPLOAD_MIME_EXTENSIONS,
).filter((type) => type.startsWith("image/"));

export const ALLOWED_IMAGE_MIME_TYPES = IMAGE_UPLOAD_MIME_TYPES.join(",");

export const ALLOWED_IMAGE_EXTENSIONS = [
  ...new Set(IMAGE_UPLOAD_MIME_TYPES.map((type) => UPLOAD_MIME_EXTENSIONS[type])),
];

/** For the "allowed types" hint under the field. */
export const ALLOWED_UPLOAD_EXTENSIONS = [
  ...new Set(Object.values(UPLOAD_MIME_EXTENSIONS)),
];

export const MAX_UPLOAD_MB = Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024);
