import { dashboardRepository } from "@/repositories/dashboard.repository";
import { DashboardData } from "@/types/dashboard";

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const [stats, topEnrolledPaths, topCompletedPaths] = await Promise.all([
      dashboardRepository.getStats(),
      dashboardRepository.getTopEnrolledPaths(5),
      dashboardRepository.getTopCompletedPaths(5),
    ]);

    return {
      stats,
      topEnrolledPaths,
      topCompletedPaths,
    };
  },
};
