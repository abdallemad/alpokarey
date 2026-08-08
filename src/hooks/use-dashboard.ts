"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { apiRequest } from "@/lib/axios";
import { DashboardData } from "@/types/dashboard";

/**
 * Fetches the statistics and top metrics for the admin dashboard landing page.
 */
export function useGetAdminData() {
  return useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: () =>
      apiRequest<DashboardData>({
        url: "/dashboard",
        method: "GET",
      }),
  });
}
