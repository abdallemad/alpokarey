import {
  PageContainer,
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "@/components/admin/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fallback for the dashboard segment.
 *
 * Sits below `layout.tsx`, so the sidebar and header stay rendered and
 * interactive while this streams — only the content column is replaced.
 */
export default function AdminDashboardLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton withAction={false} />
      <StatCardsSkeleton />

      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
