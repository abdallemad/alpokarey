import type { PathCategory, Status } from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/errors";
import {
  pathRepository,
  type PathDetailRow,
  type PathListRow,
} from "@/repositories/path.repository";
import type { Paginated } from "@/types/api";
import type {
  PathDetail,
  PathListItem,
  PublicPathSummary,
} from "@/types/path";
import type {
  PathCreateValues,
  PathListQuery,
  PathUpdateValues,
} from "@/validation/path.schema";

/**
 * Business logic for learning paths.
 *
 * This layer decides what a request is *allowed* to do. It knows nothing about
 * HTTP — no `Request`, no `Response` — so the same functions are callable from
 * an API route today or a queue worker later.
 */

function toListItem(row: PathListRow): PathListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    status: row.status,
    category: row.category,
    isFeatured: row.isFeatured,
    certificationActivated: row.certificationActivated,
    stagesCount: row._count.stages,
    enrollmentsCount: row._count.enrollments,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDetail(row: PathDetailRow): PathDetail {
  const stages = row.stages.map((stage) => ({
    id: stage.id,
    title: stage.title,
    order: stage.order,
    lessonsCount: stage._count.lessons,
    quizzesCount: stage._count.quizzes,
  }));

  return {
    ...toListItem(row),
    promoUrl: row.promoUrl,
    certificatesCount: row._count.certificates,
    lessonsCount: stages.reduce((total, stage) => total + stage.lessonsCount, 0),
    stages,
  };
}

/** `"all"` means "no filter" — translate it to `undefined` for the repository. */
function unwrapFilter<T extends string>(value: T | "all"): T | undefined {
  return value === "all" ? undefined : value;
}

/**
 * How many paths the public catalog section shows.
 *
 * A landing page is a pitch, not an index: past six cards a visitor is
 * scrolling a list instead of reading an argument. The full catalog is
 * `/paths`, when it exists.
 */
const PUBLIC_PATHS_LIMIT = 6;

export const pathService = {
  /**
   * The published catalog, for the public landing page.
   *
   * Separate from `listPaths` rather than a `status: "PUBLISHED"` call into
   * it, because the two have different **audiences**, not different filters.
   * `listPaths` is behind `requireAdmin` and returns editorial state; this one
   * is reached with no session at all, so it maps to a deliberately narrower
   * shape and takes no arguments a caller could use to widen it.
   */
  async listPublishedPaths(): Promise<PublicPathSummary[]> {
    const rows = await pathRepository.findPublished(PUBLIC_PATHS_LIMIT);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      category: row.category,
      certificationActivated: row.certificationActivated,
      stagesCount: row.stages.length,
      lessonsCount: row.stages.reduce(
        (total, stage) => total + stage._count.lessons,
        0,
      ),
    }));
  },

  async listPaths(query: PathListQuery): Promise<Paginated<PathListItem>> {
    const { page, pageSize } = query;

    const { rows, total } = await pathRepository.findMany({
      search: query.search || undefined,
      status: unwrapFilter(query.status) as Status | undefined,
      category: unwrapFilter(query.category) as PathCategory | undefined,
      isFeatured:
        query.featured === "all" ? undefined : query.featured === "true",
      sort: query.sort,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: rows.map(toListItem),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async getPath(id: string): Promise<PathDetail> {
    const row = await pathRepository.findById(id);

    if (!row) {
      throw new NotFoundError("المسار المطلوب غير موجود");
    }

    return toDetail(row);
  },

  async createPath(input: PathCreateValues): Promise<PathDetail> {
    // A path with no stages has nothing to teach — it may exist, but only as a
    // draft. Publishing is gated until at least one stage is added.
    if (input.status === "PUBLISHED") {
      throw new ConflictError(
        "لا يمكن نشر مسار جديد قبل إضافة مرحلة واحدة على الأقل. أنشئه كمسودة أولًا.",
      );
    }

    const row = await pathRepository.create({
      title: input.title,
      description: input.description,
      category: input.category ?? null,
      status: input.status,
      isFeatured: input.isFeatured,
      certificationActivated: input.certificationActivated,
      imageUrl: input.imageUrl,
      promoUrl: input.promoUrl,
    });

    return toDetail(row);
  },

  async updatePath(id: string, input: PathUpdateValues): Promise<PathDetail> {
    const existing = await pathRepository.findById(id);

    if (!existing) {
      throw new NotFoundError("المسار المطلوب غير موجود");
    }

    // Same publishing rule as creation, applied on the transition into
    // PUBLISHED rather than on every save of an already-published path.
    const isPublishing =
      input.status === "PUBLISHED" && existing.status !== "PUBLISHED";

    if (isPublishing && existing._count.stages === 0) {
      throw new ConflictError(
        "لا يمكن نشر المسار قبل إضافة مرحلة واحدة على الأقل.",
      );
    }

    // Certificates are issued on completing a path, so activating them without
    // a final assessment would hand out certificates for nothing.
    if (input.certificationActivated === true && existing._count.stages === 0) {
      throw new ConflictError(
        "لا يمكن تفعيل الشهادة قبل إضافة مراحل للمسار.",
      );
    }

    const row = await pathRepository.update(id, {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.category !== undefined && { category: input.category ?? null }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
      ...(input.certificationActivated !== undefined && {
        certificationActivated: input.certificationActivated,
      }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.promoUrl !== undefined && { promoUrl: input.promoUrl }),
    });

    return toDetail(row);
  },

  async deletePath(id: string): Promise<{ id: string }> {
    const enrollments = await pathRepository.countEnrollments(id);

    // Deleting cascades to stages, lessons and progress. Once students are
    // enrolled that would destroy their history, so it is blocked outright —
    // unpublishing is the reversible way to take a path out of circulation.
    if (enrollments > 0) {
      throw new ConflictError(
        `لا يمكن حذف المسار لوجود ${enrollments} تسجيل مرتبط به. يمكنك تحويله إلى مسودة بدلًا من حذفه.`,
      );
    }

    const exists = await pathRepository.findById(id);

    if (!exists) {
      throw new NotFoundError("المسار المطلوب غير موجود");
    }

    return pathRepository.delete(id);
  },
};
