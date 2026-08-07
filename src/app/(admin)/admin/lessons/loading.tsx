import {
  DataTableSkeleton,
  PageContainer,
  PageHeaderSkeleton,
} from "@/components/admin/shared";

export default function AdminLessonsLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <DataTableSkeleton columns={5} rows={8} />
    </PageContainer>
  );
}
