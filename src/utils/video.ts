/**
 * Turning what an author pasted into something an `<iframe>` can play.
 *
 * `Lesson.videoUrl` is free text typed by an admin, and the five things people
 * actually paste for the same video are all different URLs. Rather than asking
 * authors to hand-build an embed link — which is how a lesson ends up with a
 * blank player nobody can explain — the player normalises here.
 */

/** A YouTube video id: exactly 11 URL-safe characters. */
const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;

/**
 * The path shapes that carry the id as a segment: `/embed/ID`, `/shorts/ID`,
 * `/live/ID`, `/v/ID`.
 */
const YOUTUBE_PATH_PATTERN = /^\/(?:embed|shorts|live|v)\/([\w-]{11})/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const YOUTU_BE_HOSTS = new Set(["youtu.be", "www.youtu.be"]);

/** The id inside a YouTube link, or `null` when this is not one. */
export function toYouTubeVideoId(value: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  // An author who copied the id alone rather than the link.
  if (YOUTUBE_ID_PATTERN.test(raw)) return raw;

  let url: URL;

  try {
    // A bare `youtube.com/watch?v=…` has no protocol and would throw.
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (YOUTU_BE_HOSTS.has(host)) {
    const id = url.pathname.slice(1);
    return YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  if (!YOUTUBE_HOSTS.has(host)) return null;

  const fromQuery = url.searchParams.get("v");
  if (fromQuery && YOUTUBE_ID_PATTERN.test(fromQuery)) return fromQuery;

  const fromPath = YOUTUBE_PATH_PATTERN.exec(url.pathname);
  return fromPath ? fromPath[1] : null;
}

/**
 * The embed URL for a lesson's video, or `null` when the link is not YouTube.
 *
 * `youtube-nocookie.com` is the privacy-enhanced host: it is the same player,
 * but it does not set tracking cookies until the learner actually presses play.
 * `rel=0` keeps the end-of-video suggestions inside the same channel, so a
 * lesson does not finish by offering the learner something unrelated.
 */
export function toYouTubeEmbedUrl(value: string | null): string | null {
  const id = toYouTubeVideoId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}
