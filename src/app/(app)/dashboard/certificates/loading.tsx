import { PageContainer } from "@/components/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level fallback: the shell stays rendered and interactive while only
 * this segment streams. Shaped like the certificates page — heading, then a
 * card of rows.
 */
export default function StudentCertificatesLoading() {
  return (
    <PageContainer>
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
