import {
  PageContainer,
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "@/components/admin/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shaped like the editor it replaces: header, stat cards, then the form. */
export default function AdminLessonLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={3} />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full max-w-2xl" />
          <Skeleton className="h-24 w-full max-w-2xl" />
          <Skeleton className="h-8 w-40" />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
