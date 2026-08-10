"use client";

import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/axios";
import { queryKeys } from "@/constants/query-keys";
import type { StudentDashboard } from "@/types/student";

/**
 * The signed-in learner's dashboard.
 *
 * No filters and no pagination — the endpoint returns one shape for one person,
 * so the cache key is a constant.
 */
export function useStudentDashboard() {
  return useQuery({
    queryKey: queryKeys.student.dashboard(),
    queryFn: () =>
      apiRequest<StudentDashboard>({ url: "/me/dashboard", method: "GET" }),
  });
}
