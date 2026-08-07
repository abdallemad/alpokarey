"use client";

import * as React from "react";

import { ErrorState, PageContainer } from "@/components/admin/shared";

/**
 * Error boundary for the whole `/admin` subtree.
 *
 * Because it lives beside `layout.tsx` rather than above it, the sidebar and
 * header survive the error — the admin can navigate away instead of being
 * dropped on a bare page. Errors thrown in the layout itself bubble past this
 * to `app/global-error.tsx`.
 */
export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  React.useEffect(() => {
    // Replace with a reporting service (Sentry et al.) when one is wired up.
    console.error(error);
  }, [error]);

  return (
    <PageContainer>
      <ErrorState digest={error.digest} onRetry={retry} />
    </PageContainer>
  );
}
