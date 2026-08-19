/**
 * Enrolment shapes as they cross the HTTP boundary.
 *
 * There is no `Enrollment` list type here: the learner's enrolments are read
 * as `EnrolledPath` in `types/student.ts`, which is the same row dressed as
 * the thing the dashboard actually renders. This file holds only what the
 * **write** returns.
 */

/**
 * What `POST /api/paths/:pathId/enroll` answers with.
 *
 * The interesting field is `startLessonId`. Enrolling is never the point — the
 * point is starting to study — so the endpoint that creates the enrolment also
 * says which lesson to open, and the client redirects straight to it rather
 * than bouncing through a page whose only job would be to ask the same
 * question again. See `docs/enrollment-feature.md`.
 */
export type EnrollmentResult = {
  id: string;
  pathId: string;
  /**
   * `false` when the learner was already enrolled and this request changed
   * nothing. The endpoint is idempotent, so a double click, a retried mutation
   * or a second tab all succeed; this flag is only there so the toast can say
   * the honest thing.
   */
  isNew: boolean;
  progress: number;
  isCompleted: boolean;
  /**
   * Where to send the learner now: the first lesson they have not finished,
   * or the first lesson of the path for a fresh enrolment.
   *
   * `null` only when the path has no lessons at all — the academy's gap, not
   * the learner's, and the client falls back to `/learn/:pathId`, which says
   * so.
   */
  startLessonId: string | null;
  enrolledAt: string;
};
