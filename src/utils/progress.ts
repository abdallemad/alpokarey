/**
 * Progress arithmetic, shared by every Service that reports a percentage.
 *
 * Pure functions with no React and no database, per `docs/folder-structure.md`.
 * They live here rather than in one Service because the learner's dashboard,
 * their path list and the player all report the same figures, and two copies of
 * a rounding rule are two figures that will eventually disagree.
 */

/** Percentages are integers in 0–100 everywhere they leave the Service layer. */
export function toPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * How far through a set of lessons a learner is.
 *
 * A curriculum with **no lessons is 0%, not 100%**: dividing by zero would
 * otherwise congratulate a learner for finishing an empty stage, and the empty
 * stage is the academy's gap rather than their achievement.
 */
export function toProgressPercent(completed: number, total: number): number {
  return total <= 0 ? 0 : toPercent((completed / total) * 100);
}

/**
 * The two progress records in the database, reconciled into one figure.
 *
 * `LessonProgress` is the per-lesson truth; `Enrollment.progress` is a stored
 * column that predates it and that `progressService` maintains as a high-water
 * mark. Most enrolments carry a percentage recorded before per-lesson tracking
 * existed, with no lesson rows to account for it — so the stored column wins
 * whenever it is ahead, and the caller is told which record answered.
 *
 * Extracted here because the dashboard, the path list, the player and the
 * certificate gate all have to agree: a path the player calls 100% must be a
 * path the certificate endpoint also calls finished, or the button is enabled
 * against an endpoint that refuses it.
 */
export function reconcileProgress(
  computed: number,
  stored: number,
): { progress: number; usesStoredProgress: boolean } {
  const storedPercent = toPercent(stored);
  const usesStoredProgress = storedPercent > computed;

  return {
    progress: usesStoredProgress ? storedPercent : computed,
    usesStoredProgress,
  };
}

/**
 * Whether a path counts as finished.
 *
 * `Enrollment.isCompleted` is honoured on its own because an admin — or the
 * old system — may have marked an enrolment complete without the lesson rows
 * to prove it, and demoting such a learner would take back something they were
 * already told they had.
 *
 * A path with **no lessons is never complete**, for the same reason
 * `toProgressPercent` calls it 0%: an empty curriculum is the academy's gap,
 * not the learner's achievement, and certifying it would be absurd.
 */
export function isPathComplete(input: {
  enrollmentIsCompleted: boolean;
  lessonsCount: number;
  progress: number;
}): boolean {
  return (
    input.enrollmentIsCompleted ||
    (input.lessonsCount > 0 && input.progress === 100)
  );
}
