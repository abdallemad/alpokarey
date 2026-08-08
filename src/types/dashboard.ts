export interface DashboardStats {
  publishedPaths: number;
  totalEnrollments: number;
  averageCompletionRate: number; // as a percentage (0-100)
  grantedCertificates: number;
}

export interface TopPathMetric {
  id: string;
  title: string;
  imageUrl: string | null;
  count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  topEnrolledPaths: TopPathMetric[];
  topCompletedPaths: TopPathMetric[];
}
