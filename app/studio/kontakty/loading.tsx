import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";

export default function StudioContactsLoading() {
  return (
    <AdminTableSkeleton
      title="Zprávy z kontaktu"
      description="Přijaté dotazy z webu a historie odpovědí odeslaných přes studio."
      rows={6}
      withSearch={false}
    />
  );
}
