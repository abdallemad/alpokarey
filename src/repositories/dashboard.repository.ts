import { db } from "@/lib/db";
import { DashboardStats, TopPathMetric } from "@/types/dashboard";

export const dashboardRepository = {
  async getStats(): Promise<DashboardStats> {
    const [publishedPaths, totalEnrollments, grantedCertificates, progressAvg] = await Promise.all([
      db.path.count({ where: { status: "PUBLISHED" } }),
      db.enrollment.count(),
      db.certificate.count(),
      db.enrollment.aggregate({
        _avg: {
          progress: true,
        },
      }),
    ]);

    return {
      publishedPaths,
      totalEnrollments,
      grantedCertificates,
      averageCompletionRate: Math.round(progressAvg._avg.progress || 0),
    };
  },

  async getTopEnrolledPaths(limit = 5): Promise<TopPathMetric[]> {
    const paths = await db.path.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: {
        enrollments: {
          _count: "desc",
        },
      },
      take: limit,
    });

    return paths.map((p) => ({
      id: p.id,
      title: p.title,
      imageUrl: p.imageUrl,
      count: p._count.enrollments,
    }));
  },

  async getTopCompletedPaths(limit = 5): Promise<TopPathMetric[]> {
    const paths = await db.path.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        _count: {
          select: { certificates: true },
        },
      },
      orderBy: {
        certificates: {
          _count: "desc",
        },
      },
      take: limit,
    });

    return paths.map((p) => ({
      id: p.id,
      title: p.title,
      imageUrl: p.imageUrl,
      count: p._count.certificates,
    }));
  },
};
