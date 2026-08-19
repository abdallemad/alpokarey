import type { PathCategory, Status } from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { storage } from "@/lib/storage";
import { enrollmentRepository } from "@/repositories/enrollment.repository";
import { lessonProgressRepository } from "@/repositories/lesson-progress.repository";
import {
  pathRepository,
  type PathDetailRow,
  type PathListRow,
  type PathOverviewRow,
  type PublicPathRow,
} from "@/repositories/path.repository";
import type { AppUser } from "@/repositories/user.repository";
import type { Paginated } from "@/types/api";
import type {
  PathDetail,
  PathListItem,
  PathOverview,
  PathViewerState,
  PublicPathSummary,
} from "@/types/path";
import {
  isPathComplete,
  reconcileProgress,
  toProgressPercent,
} from "@/utils/progress";
import { toStorageKey } from "@/utils/upload";
import type {
  PathCreateValues,
  PathListQuery,
  PathUpdateValues,
  PublicPathsQuery,
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

/**
 * One catalog card. The narrowest shape the product exposes.
 *
 * `lessonsCount` is summed here rather than counted in SQL because the stage
 * rows are already loaded for it, and "how big is this path" is a question the
 * card asks in one number.
 */
function toPublicSummary(row: PublicPathRow): PublicPathSummary {
  return {
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
  };
}

/**
 * The curriculum outline, with a tick beside anything this viewer has finished.
 *
 * `completed` is empty for a visitor who is not enrolled, which is the whole
 * of the difference between the two audiences' view of the outline: same
 * stages, same lessons, no ticks.
 */
function toOverviewStages(
  row: PathOverviewRow,
  completed: ReadonlySet<string>,
): PathOverview["stages"] {
  return row.stages.map((stage) => ({
    id: stage.id,
    title: stage.title,
    order: stage.order,
    lessons: stage.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      type: lesson.type,
      duration: lesson.duration,
      isCompleted: completed.has(lesson.id),
    })),
    lessonsCount: stage.lessons.length,
    quizzesCount: stage.quizzes.length,
  }));
}

/** `"all"` means "no filter" — translate it to `undefined` for the repository. */
function unwrapFilter<T extends string>(value: T | "all"): T | undefined {
  return value === "all" ? undefined : value;
}

export const pathService = {
  /**
   * The published catalog — `/paths`, and the landing page's teaser.
   *
   * Separate from `listPaths` rather than a `status: "PUBLISHED"` call into
   * it, because the two have different **audiences**, not different filters.
   * `listPaths` is behind `requireAdmin` and returns editorial state; this one
   * is reached with no session at all, so it maps to a deliberately narrower
   * shape.
   *
   * It does now take a query, which the earlier "takes no arguments" version
   * did not. The safety never rested on the absence of parameters: it rests on
   * `buildPublicWhere` writing `status: "PUBLISHED"` where no caller can reach
   * it, on both filters being closed enums, and on `pageSize` having a
   * ceiling. See `docs/tracks-catalog-feature.md` §5.
   *
   * One method for the catalog **and** the six-card teaser on `/`, rather than
   * two: the teaser is the first page of the featured ordering, and a second
   * code path would be a second answer to "what is published?".
   */
  async listPublicPaths(
    query: PublicPathsQuery,
  ): Promise<Paginated<PublicPathSummary>> {
    const { page, pageSize } = query;

    const { rows, total } = await pathRepository.findPublishedMany({
      search: query.search || undefined,
      category: unwrapFilter(query.category) as PathCategory | undefined,
      certificationActivated:
        query.certification === "all"
          ? undefined
          : query.certification === "true",
      sort: query.sort,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: rows.map(toPublicSummary),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  /**
   * One path as `/paths/:pathId` shows it — the pitch, the curriculum outline,
   * and where the person looking at it stands.
   *
   * `user` is **nullable on purpose**: this is the only read in the product
   * that serves a visitor and a learner from one endpoint. It has to, because
   * they are looking at the same page — the difference between them is a
   * button, not a document, and splitting it in two would mean two queries
   * that could drift about what a path contains.
   *
   * Three rules:
   *
   * 1. **A draft is a 404 for anyone not enrolled in it.** Not a 403: a path
   *    that has never been published is not a thing the public has been refused,
   *    it is a thing that does not exist yet, and a 403 would confirm the id is
   *    real to anyone guessing.
   * 2. **An enrolled learner keeps their path when it is unpublished.** The
   *    enrolment outlives the admin's decision, so the page still renders and
   *    `status` tells the UI to say "قيد الإعداد".
   * 3. **Progress is reconciled, never recomputed differently.** It goes
   *    through `utils/progress.ts` like the dashboard, the player and the
   *    certificate gate, so the bar here and the bar in the player are the same
   *    number.
   */
  async getPathOverview(
    pathId: string,
    user: AppUser | null,
  ): Promise<PathOverview> {
    const [row, enrollment] = await Promise.all([
      pathRepository.findOverview(pathId),
      user
        ? enrollmentRepository.findByUserAndPath(user.id, pathId)
        : Promise.resolve(null),
    ]);

    if (!row) {
      throw new NotFoundError("المسار المطلوب غير موجود");
    }

    if (row.status !== "PUBLISHED" && !enrollment) {
      throw new NotFoundError("المسار المطلوب غير موجود");
    }

    // Curriculum order — the outline's order — so "the first lesson" and "the
    // first unfinished lesson" are both answerable by position alone.
    const lessonIds = row.stages.flatMap((stage) =>
      stage.lessons.map((lesson) => lesson.id),
    );

    const completed = new Set(
      user && enrollment
        ? await lessonProgressRepository.findCompletedIds(user.id, lessonIds)
        : [],
    );

    const stages = toOverviewStages(row, completed);

    const { progress, usesStoredProgress } = reconcileProgress(
      toProgressPercent(completed.size, lessonIds.length),
      enrollment?.progress ?? 0,
    );

    const isCompleted = enrollment
      ? isPathComplete({
          enrollmentIsCompleted: enrollment.isCompleted,
          lessonsCount: lessonIds.length,
          progress,
        })
      : false;

    const viewer: PathViewerState = {
      isSignedIn: user !== null,
      isEnrolled: enrollment !== null,
      progress: enrollment ? progress : 0,
      // Follows whichever record drove `progress`, exactly as the player does,
      // so "n من m درس" cannot contradict the percentage beside it.
      completedLessonsCount: !enrollment
        ? 0
        : usesStoredProgress
          ? Math.max(
              completed.size,
              Math.round((progress / 100) * lessonIds.length),
            )
          : completed.size,
      isCompleted,
      // For a visitor this is the first lesson, which is what "ابدأ" means
      // before enrolling; for a learner it is where they left off.
      startLessonId:
        lessonIds.find((id) => !completed.has(id)) ?? lessonIds[0] ?? null,
      enrolledAt: enrollment?.createdAt.toISOString() ?? null,
    };

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      promoUrl: row.promoUrl,
      category: row.category,
      status: row.status,
      certificationActivated: row.certificationActivated,
      stagesCount: stages.length,
      lessonsCount: lessonIds.length,
      quizzesCount: stages.reduce(
        (total, stage) => total + stage.quizzesCount,
        0,
      ),
      stages,
      viewer,
    };
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

    const previousImageKey = toStorageKey(existing.imageUrl);

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

    // The cover image was replaced or cleared, and the old object was one this
    // app stored — so nothing points at it any more. Deleted *after* the write
    // succeeds: a failed unlink leaves a stray file, while unlinking first
    // would leave a saved record pointing at a file that is already gone.
    //
    // `toStorageKey` returns `null` for an absolute URL, which is what stops
    // this from trying to delete somebody else's Cloudinary asset.
    if (previousImageKey && row.imageUrl !== existing.imageUrl) {
      await storage.remove(previousImageKey);
    }

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

    const deleted = await pathRepository.delete(id);

    // Same order and the same reasoning as `lessonService.removeAttachment`:
    // the row is the record that matters, so the file goes after it.
    await storage.remove(toStorageKey(exists.imageUrl));

    return deleted;
  },
};
