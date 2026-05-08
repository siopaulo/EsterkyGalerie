import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";

export default function StudioReviewsLoading() {
  return (
    <AdminTableSkeleton
      title="Reference"
      description="Veřejné recenze z formuláře na /reference."
      rows={6}
      withSearch={false}
    />
  );
}
