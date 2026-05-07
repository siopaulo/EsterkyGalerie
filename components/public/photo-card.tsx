import { CloudinaryImage } from "@/components/shared/cloudinary-image";
import { CARD_WIDTHS } from "@/lib/cloudinary-url";
import type { PhotoWithTags } from "@/types/database";
import { cn } from "@/lib/utils";

interface PhotoCardProps {
  photo: PhotoWithTags;
  className?: string;
  priority?: boolean;
  /**
   * Optional override pro `sizes`, pokud karta sedí v jiném gridu, než je
   * defaultní galerie 2/3/4 sloupce.
   */
  sizes?: string;
  onClick?: () => void;
}

// Galerie grid:
//   - mobil:    grid-cols-2          → ~50vw
//   - sm (640): grid-cols-3          → ~33vw
//   - lg (1024):grid-cols-4          → ~25vw
// Aktivně držíme malé varianty – karta nikdy nepotřebuje 1080+ wide.
const DEFAULT_CARD_SIZES =
  "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

export function PhotoCard({ photo, className, priority, sizes, onClick }: PhotoCardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      type={onClick ? "button" : undefined}
      className={cn(
        "group relative block w-full overflow-hidden rounded-md bg-muted text-left",
        onClick && "cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={photo.alt_text || photo.display_name}
    >
      <CloudinaryImage
        publicId={photo.cloudinary_public_id}
        alt={photo.alt_text || photo.display_name}
        aspectClass="aspect-[4/5]"
        priority={priority}
        widths={CARD_WIDTHS}
        sizes={sizes ?? DEFAULT_CARD_SIZES}
        variant={{ crop: "fill", gravity: "auto" }}
        className="transition-transform duration-700 group-hover:scale-[1.02]"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="line-clamp-2 font-serif text-base text-white">
          {photo.display_name}
        </p>
        {photo.tags.length > 0 ? (
          <p className="mt-1 text-xs text-white/75">
            {photo.tags.slice(0, 3).map((t) => t.name).join(" · ")}
          </p>
        ) : null}
      </div>
    </Tag>
  );
}
