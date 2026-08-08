import type { PathCategory, Status } from "@prisma/client";

/**
 * Path shapes as they cross the HTTP boundary.
 *
 * Dates are ISO strings, not `Date` — JSON has no date type, and typing them
 * honestly here stops `.toLocaleDateString()` from blowing up on the client.
 */

export type PathListItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: Status;
  category: PathCategory | null;
  isFeatured: boolean;
  certificationActivated: boolean;
  stagesCount: number;
  enrollmentsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PathStageSummary = {
  id: string;
  title: string;
  order: number;
  lessonsCount: number;
  quizzesCount: number;
};

/**
 * The list screen's filter state, mirrored in the URL query string.
 *
 * Declared separately from `pathListQuerySchema`'s input type because Zod's
 * `coerce` widens its input to `unknown`, which makes for a poor React Query
 * cache key.
 */
export type PathsQueryState = {
  search: string;
  status: string;
  category: string;
  featured: string;
  sort: string;
  page: number;
  pageSize: number;
};

export type PathDetail = PathListItem & {
  promoUrl: string | null;
  certificatesCount: number;
  /** Total lessons across every stage — the headline "size" of a path. */
  lessonsCount: number;
  stages: PathStageSummary[];
};
