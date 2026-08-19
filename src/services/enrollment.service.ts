import { ConflictError, NotFoundError } from "@/lib/errors";
import { enrollmentRepository } from "@/repositories/enrollment.repository";
import { learnRepository } from "@/repositories/learn.repository";
import { lessonProgressRepository } from "@/repositories/lesson-progress.repository";
import { pathRepository } from "@/repositories/path.repository";
import type { AppUser } from "@/repositories/user.repository";
import type { EnrollmentResult } from "@/types/enrollment";

/**
 * Business logic for enrolling in a path — the one write that turns a visitor
 * into a student.
 *
 * Everything the rest of the learning experience does is gated on the row this
 * module creates: `learnService.requireEnrollment` refuses the curriculum, the
 * lessons, the exams and the certificate without it. So three rules shape it:
 *
 * 1. **Only a published path may be joined.** A draft is the admin's
 *    workspace; `pathService` already refuses to publish a path with no
 *    stages, so "published" is the academy's own signal that there is
 *    something here to study.
 * 2. **Enrolling twice is not an error.** The unique `(userId, pathId)` index
 *    makes the write idempotent at the database, and a learner who
 *    double-clicks, retries on a flaky connection, or has the page open in two
 *    tabs gets the same answer every time. Progress is never reset — see
 *    `enrollmentRepository.upsert`.
 * 3. **The answer says where to go.** Enrolling is a means; studying is the
 *    end. The result carries `startLessonId` so the client can send the learner
 *    straight into the player instead of leaving them on a page that now says
 *    "you are enrolled" and nothing else.
 *
 * Knows nothing about HTTP — no `Request`, no `Response`.
 */

/**
 * The lesson this learner should open now.
 *
 * A fresh enrolment starts at the top; a repeat request resumes where the
 * learner left off, which is the same "first unfinished lesson" rule
 * `/learn/:pathId` and the dashboard's resume card already apply. Three copies
 * of that rule would be three answers, so this one derives from the ordered
 * lesson ids `learnRepository` returns — the same order the path page's
 * outline and the player's sidebar render.
 *
 * `null` means the path has no lessons at all. That is the academy's gap, not
 * the learner's, and the caller says so rather than inventing a destination.
 */
async function resolveStartLesson(
  userId: string,
  pathId: string,
  isNew: boolean,
): Promise<string | null> {
  const lessonIds = await learnRepository.findLessonIdsByPath(pathId);

  if (lessonIds.length === 0) return null;
  // Nothing can be completed in an enrolment that did not exist a moment ago,
  // so the progress read is skipped entirely for the common case.
  if (isNew) return lessonIds[0];

  const completed = new Set(
    await lessonProgressRepository.findCompletedIds(userId, lessonIds),
  );

  return lessonIds.find((id) => !completed.has(id)) ?? lessonIds[0];
}

export const enrollmentService = {
  /**
   * Enrol this learner in this path, and say where to start.
   *
   * The order of the reads is deliberate. The enrolment is checked **before**
   * the publication rule, so a learner who joined a path that has since been
   * unpublished is never told they may not join the course they are already
   * studying — the same asymmetry `pathService.getPathOverview` applies to the
   * page this button sits on.
   */
  async enroll(user: AppUser, pathId: string): Promise<EnrollmentResult> {
    const [path, existing] = await Promise.all([
      pathRepository.findSummary(pathId),
      enrollmentRepository.findByUserAndPath(user.id, pathId),
    ]);

    if (!path) {
      throw new NotFoundError("المسار المطلوب غير موجود");
    }

    if (!existing && path.status !== "PUBLISHED") {
      throw new ConflictError(
        "هذا المسار لم يُنشر بعد، ولا يمكن التسجيل فيه حاليًا.",
      );
    }

    const isNew = existing === null;

    // `upsert` even though the row is known to be missing: two clicks race, and
    // losing that race must not become a 500 the learner sees.
    const enrollment =
      existing ?? (await enrollmentRepository.upsert(user.id, pathId));

    return {
      id: enrollment.id,
      pathId,
      isNew,
      progress: enrollment.progress,
      isCompleted: enrollment.isCompleted,
      startLessonId: await resolveStartLesson(user.id, pathId, isNew),
      enrolledAt: enrollment.createdAt.toISOString(),
    };
  },
};
