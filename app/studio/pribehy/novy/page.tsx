import { AdminPageHeader } from "@/components/admin/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { requireAdmin } from "@/lib/auth";
import { createNewStoryAndRedirect } from "@/features/stories/actions";

export default async function NewStoryPage() {
  await requireAdmin();
  return (
    <>
      <AdminPageHeader
        title="Nový příběh"
        description="Založte nový příběh. Moduly přidáte v editoru."
        breadcrumbs={[
          { label: "Studio", href: "/studio" },
          { label: "Příběhy", href: "/studio/pribehy" },
          { label: "Nový" },
        ]}
      />
      <section className="max-w-2xl px-6 py-8 md:px-10">
        <form action={createNewStoryAndRedirect} className="space-y-4 rounded-lg border border-border bg-background p-6">
          <div className="space-y-1.5">
            <Label htmlFor="title">Název příběhu</Label>
            <Input id="title" name="title" required placeholder="Např. Ranní mlha ve stáji Kamenný Dvůr" />
          </div>
          <Button type="submit" variant="primary">Založit a otevřít editor</Button>
        </form>
      </section>
    </>
  );
}
