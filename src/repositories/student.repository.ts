import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Data access for a learner's own record — enrolments, progress, attempts and
 * certificates.
 *
 * Every query here takes a `userId` and filters by it. That is the whole
 * security model of this repository: there is no "all enrolments" read, so a
 * caller cannot accidentally serve one learner another's history.
 */

const enrollmentSelect = {
  id: true,
  progress: true,
  isCompleted: true,
  createdAt: true,
  path: {
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      category: true,
      certificationActivated: true,
      // The whole curriculum, ordered — this is what makes "how far am I?"
      // and "what is next?" answerable in one pass without a second query
      // per path.
      stages: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, order: true },
          },
        },
      },
    },
  },
} satisfies Prisma.EnrollmentSelect;

export type StudentEnrollmentRow = Prisma.EnrollmentGetPayload<{
  select: typeof enrollmentSelect;
}>;

const attemptSelect = {
  id: true,
  score: true,
  isPassed: true,
  createdAt: true,
  quiz: {
    select: {
      id: true,
      title: true,
      passingScore: true,
      isFinal: true,
      stage: {
        select: {
          title: true,
          path: { select: { id: true, title: true } },
        },
      },
    },
  },
} satisfies Prisma.QuizAttemptSelect;

export type StudentAttemptRow = Prisma.QuizAttemptGetPayload<{
  select: typeof attemptSelect;
}>;

const certificateSelect = {
  id: true,
  issuedAt: true,
  path: { select: { id: true, title: true } },
} satisfies Prisma.CertificateSelect;

export type StudentCertificateRow = Prisma.CertificateGetPayload<{
  select: typeof certificateSelect;
}>;

export const studentRepository = {
  /** Every path this learner is enrolled in, with its full curriculum. */
  findEnrollments(userId: string) {
    return db.enrollment.findMany({
      where: { userId },
      select: enrollmentSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Ids of the lessons this learner has finished.
   *
   * Returned as a flat list so the Service can turn it into a `Set` once and
   * answer "is this lesson done?" in constant time while walking curricula —
   * rather than issuing a query per lesson.
   */
  async findCompletedLessonIds(userId: string): Promise<string[]> {
    const rows = await db.lessonProgress.findMany({
      where: { userId, isCompleted: true },
      select: { lessonId: true },
    });

    return rows.map((row) => row.lessonId);
  },

  findRecentAttempts(userId: string, take: number) {
    return db.quizAttempt.findMany({
      where: { userId },
      select: attemptSelect,
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  findCertificates(userId: string) {
    return db.certificate.findMany({
      where: { userId },
      select: certificateSelect,
      orderBy: { issuedAt: "desc" },
    });
  },
};
