import {
  DataTableSkeleton,
  PageContainer,
  PageHeaderSkeleton,
} from "@/components/admin/shared";

export default function AdminUsersLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton withAction={false} />
      <DataTableSkeleton columns={4} rows={8} />
    </PageContainer>
  );
}
