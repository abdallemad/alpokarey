import {
  DataTableSkeleton,
  PageContainer,
  PageHeaderSkeleton,
} from "@/components/admin/shared";

/**
 * Route-level fallback: the shell stays interactive while this segment loads.
 * `withAction={false}` matches the real header, which has no create button —
 * stages are created from inside their path.
 */
export default function AdminStagesLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton withAction={false} />
      <DataTableSkeleton columns={4} rows={10} />
    </PageContainer>
  );
}
