/**
 * What the storage driver returns, as it crosses the HTTP boundary.
 *
 * It lives in its own file rather than in `types/lesson.ts`, where it started:
 * `POST /api/uploads` is deliberately generic — it knows nothing about lessons
 * — and now that a path's cover image goes through it too, filing its response
 * shape under lessons would be describing the wrong thing.
 */
export type UploadedFile = {
  /** Storage-driver object key — what `storage.remove()` takes. */
  key: string;
  /** Where the object is served from, e.g. `/uploads/<key>`. */
  url: string;
  /** The original filename, for display only. It never touches the disk. */
  name: string;
  size: number;
  contentType: string;
};
