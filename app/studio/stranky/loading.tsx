import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";

export default function StudioPagesLoading() {
  return (
    <AdminTableSkeleton
      title="Stránky"
      description="Statické stránky webu s modulárním obsahem."
      rows={6}
      withSearch={false}
    />
  );
}
