import {
  DataTableSkeleton,
  PageContainer,
  PageHeaderSkeleton,
} from "@/components/admin/shared";

export default function AdminQuizzesLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <DataTableSkeleton columns={5} rows={6} />
    </PageContainer>
  );
}
