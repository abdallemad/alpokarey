import {
  PageContainer,
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "@/components/admin/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPathDetailLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <StatCardsSkeleton />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
