import type { RenderableBlock } from "@/features/blocks/render";
import { parseBlockPayload, type BlockType } from "@/features/blocks/schemas";

/**
 * Najde všechna ID fotek referencovaná v blocích (z validních payloadů).
 */
export function collectPhotoIds(blocks: RenderableBlock[]): string[] {
  const out = new Set<string>();
  for (const b of blocks) {
    const parsed = parseBlockPayload(b.block_type, b.payload);
    if (!parsed.ok) continue;
    pushIds(parsed.type, parsed.data, out);
  }
  return Array.from(out);
}

function pushIds(type: BlockType, data: unknown, out: Set<string>) {
  if (type === "hero") {
    const id = (data as { background_photo_id?: string | null }).background_photo_id;
    if (id) out.add(id);
    return;
  }
  if (type === "single_image") {
    out.add((data as { photo_id: string }).photo_id);
    return;
  }
  if (type === "image_pair") {
    const d = data as { left_photo_id: string; right_photo_id: string };
    out.add(d.left_photo_id);
    out.add(d.right_photo_id);
    return;
  }
  if (type === "image_carousel" || type === "photo_grid" || type === "featured_photos") {
    for (const id of (data as { photo_ids: string[] }).photo_ids) out.add(id);
    return;
  }
  if (type === "home_hero" || type === "home_gallery_carousel") {
    const ids = (data as { photo_ids?: string[] }).photo_ids ?? [];
    for (const id of ids) out.add(id);
    return;
  }
  if (type === "story_intro") {
    const id = (data as { cover_photo_id?: string | null }).cover_photo_id;
    if (id) out.add(id);
    return;
  }
}
