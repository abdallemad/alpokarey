import { MyPathsSkeleton } from "@/components/app/paths/my-paths-skeleton";
import { PageContainer } from "@/components/shared";

/**
 * Route-level fallback: the shell stays rendered and interactive while only
 * this segment streams.
 */
export default function MyPathsLoading() {
  return (
    <PageContainer>
      <MyPathsSkeleton />
    </PageContainer>
  );
}
