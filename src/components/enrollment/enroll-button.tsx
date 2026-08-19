"use client";

import Link from "next/link";
import { ArrowLeft, GraduationCap, Loader2, LogIn, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useEnrollInPath } from "@/hooks/use-enrollment";
import { cn } from "@/lib/utils";

type EnrollButtonProps = {
  pathId: string;
  /** From `PathOverview.viewer` — resolved on the server, not from Clerk. */
  isSignedIn: boolean;
  isEnrolled: boolean;
  /** Where "متابعة" goes. `null` when the path has no lessons yet. */
  startLessonId: string | null;
  /** A path with nothing in it cannot be started, and says so. */
  hasLessons: boolean;
  className?: string;
};

/**
 * The one control that turns a reader into a student.
 *
 * It renders **one of three things**, and which one is decided entirely by the
 * `viewer` object the server sent — never by asking Clerk on the client. That
 * matters because the server is also what the enrolment endpoint will check: a
 * button drawn from the same answer the API will give cannot offer something
 * the API then refuses.
 *
 * | Viewer | Sees | Goes to |
 * |---|---|---|
 * | Signed out | "أنشئ حسابك للتسجيل" | `/sign-up` |
 * | Signed in, not enrolled | "التسجيل في المسار" | the first lesson, after the write |
 * | Enrolled | "متابعة التعلّم" | the first lesson they have not finished |
 *
 * The enrolled case is a plain link, not a mutation: the row already exists,
 * and re-posting to enrol on the way into a lesson would be a write nobody
 * asked for. The redirect after a real enrolment lives in
 * `hooks/use-enrollment.ts`, so the catalog card can reuse this button later
 * and land in exactly the same place.
 *
 * Signing out and back in is not handled here beyond the sign-up link: Clerk
 * returns to `/auth-callback`, which sends learners to their dashboard rather
 * than back to this page. See `docs/enrollment-feature.md` §8.
 */
export function EnrollButton({
  pathId,
  isSignedIn,
  isEnrolled,
  startLessonId,
  hasLessons,
  className,
}: EnrollButtonProps) {
  const enroll = useEnrollInPath(pathId);

  if (!isSignedIn) {
    return (
      <Button
        size="lg"
        className={cn("w-full", className)}
        nativeButton={false}
        render={<Link href={ROUTES.signUp} />}
      >
        <LogIn />
        أنشئ حسابك للتسجيل
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <Button
        size="lg"
        className={cn("w-full", className)}
        nativeButton={false}
        render={
          <Link
            href={
              startLessonId
                ? ROUTES.app.lesson(pathId, startLessonId)
                : ROUTES.app.learn(pathId)
            }
          />
        }
      >
        <PlayCircle />
        متابعة التعلّم
        {/* Forward points left in RTL — design-system.md §10. */}
        <ArrowLeft />
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className={cn("w-full", className)}
      // An empty path would enrol fine and then strand the learner on a player
      // with nothing to play. Refusing here is kinder than explaining there.
      disabled={!hasLessons || enroll.isPending}
      onClick={() => enroll.mutate()}
    >
      {enroll.isPending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <GraduationCap />
      )}
      {enroll.isPending ? "جارٍ التسجيل…" : "التسجيل في المسار"}
    </Button>
  );
}
