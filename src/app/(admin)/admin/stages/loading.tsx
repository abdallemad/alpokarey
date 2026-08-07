import {
  DataTableSkeleton,
  PageContainer,
  PageHeaderSkeleton,
} from "@/components/admin/shared";

export default function AdminStagesLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <DataTableSkeleton columns={4} rows={6} />
    </PageContainer>
  );
}
