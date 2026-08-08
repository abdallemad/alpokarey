import { NextRequest } from "next/server";

import { handleRouteError, ok } from "@/lib/api-response";
import { authService } from "@/services/auth.service";
import { dashboardService } from "@/services/dashboard.service";

export async function GET(request: NextRequest) {
  try {
    await authService.requireAdmin();
    return ok(await dashboardService.getDashboardData());
  } catch (error) {
    return handleRouteError(error);
  }
}
