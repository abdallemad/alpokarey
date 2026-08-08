import axios, { type AxiosRequestConfig } from "axios";

import type { ApiResponse } from "@/types/api";

/**
 * The one HTTP client in the app.
 *
 * React Query hooks are the only callers, and this only ever talks to
 * `app/api`. The relative `baseURL` is deliberate: these requests originate in
 * the browser, so the current origin is always the right host.
 */
export const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

/** An error carrying the server's message and field-level details. */
export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Unwraps the `ApiResponse` envelope so hooks receive `T` directly, and turns
 * any failure — HTTP or in-envelope — into an `ApiRequestError` whose message
 * is already Arabic and safe to show in a toast.
 */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<ApiResponse<T>>(config);

    if (!response.data.success) {
      const { message, code, details } = response.data.error;
      throw new ApiRequestError(message, code, response.status, details);
    }

    return response.data.data;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;

    if (axios.isAxiosError<ApiResponse<never>>(error)) {
      const payload = error.response?.data;

      if (payload && !payload.success) {
        throw new ApiRequestError(
          payload.error.message,
          payload.error.code,
          error.response?.status ?? 500,
          payload.error.details,
        );
      }

      throw new ApiRequestError(
        error.code === "ERR_NETWORK"
          ? "تعذّر الاتصال بالخادم. تحقّق من اتصالك بالإنترنت."
          : "حدث خطأ أثناء الاتصال بالخادم",
        error.code ?? "NETWORK_ERROR",
        error.response?.status ?? 0,
      );
    }

    throw error;
  }
}
