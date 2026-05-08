import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";

export default function StudioStoriesLoading() {
  return (
    <AdminTableSkeleton
      title="Příběhy"
      description="Modulární obsahové příběhy z focení."
      rows={8}
    />
  );
}
