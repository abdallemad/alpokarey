"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { makeQueryClient } from "@/lib/query-client";

/**
 * Supplies the React Query cache to the whole app.
 *
 * The client is created inside `useState` so each browser session gets exactly
 * one, and so it is never created during a render that React might throw away.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
