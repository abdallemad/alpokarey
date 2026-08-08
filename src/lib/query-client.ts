import { QueryClient } from "@tanstack/react-query";

import { ApiRequestError } from "@/lib/axios";

/**
 * Shared React Query defaults.
 *
 * Admin data changes rarely within a session, so a short `staleTime` avoids a
 * refetch on every window focus while still keeping lists fresh. Client errors
 * (4xx) are never retried — a 403 or a 422 will fail identically next time.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (
            error instanceof ApiRequestError &&
            error.status >= 400 &&
            error.status < 500
          ) {
            return false;
          }

          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
