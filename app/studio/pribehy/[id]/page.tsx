import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { StoryEditor } from "@/components/admin/story-editor";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { Photo, Story, StoryBlock, Tag } from "@/types/database";

type Params = Promise<{ id: string }>;

export default async function StudioStoryEditPage({ params }: { params: Params }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createSupabaseAdmin();

  const [{ data: story }, { data: blocks }, { data: tagRows }, { data: allTags }, { data: photos }] =
    await Promise.all([
      admin.from("stories").select("*").eq("id", id).maybeSingle(),
      admin
        .from("story_blocks")
        .select("*")
        .eq("story_id", id)
        .order("sort_order", { ascending: true }),
      admin.from("story_tags").select("tag_id, tags(*)").eq("story_id", id),
      admin.from("tags").select("*").order("name"),
      admin
        .from("photos")
        .select("id, display_name, cloudinary_public_id, alt_text, visibility")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(400),
    ]);

  if (!story) notFound();

  const tagSlugs = ((tagRows ?? []) as { tag_id: string; tags: Tag | Tag[] }[])
    .flatMap((r) => (Array.isArray(r.tags) ? r.tags : [r.tags]))
    .filter(Boolean)
    .map((t) => (t as Tag).slug);

  return (
    <>
      <AdminPageHeader
        title={(story as Story).title}
        description="Editor příběhu – metadata, cover, tagy a moduly."
        breadcrumbs={[
          { label: "Studio", href: "/studio" },
          { label: "Příběhy", href: "/studio/pribehy" },
          { label: (story as Story).title },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href={`/pribehy/${(story as Story).slug}`} target="_blank">
              Zobrazit na webu
            </Link>
          </Button>
        }
      />
      <section className="max-w-full px-4 py-8 md:px-10">
        <StoryEditor
          story={story as Story}
          blocks={(blocks ?? []) as StoryBlock[]}
          initialTagSlugs={tagSlugs}
          availableTags={(allTags ?? []) as Tag[]}
          availablePhotos={((photos ?? []) as Pick<Photo, "id" | "display_name" | "cloudinary_public_id" | "alt_text" | "visibility">[])}
        />
      </section>
    </>
  );
}
