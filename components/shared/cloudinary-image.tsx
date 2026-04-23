import { cldUrl, cldSrcSet, cldBlur, GALLERY_WIDTHS, CLOUDINARY_CONFIGURED, type CldVariant } from "@/lib/cloudinary-url";
import { cn } from "@/lib/utils";

interface CloudinaryImageProps {
  publicId: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  variant?: CldVariant;
  widths?: number[];
  priority?: boolean;
  aspectClass?: string;
  /** Fallback vizuál když nemáme platný publicId nebo chybí Cloudinary config. */
  fallbackLabel?: string;
}

/**
 * Cloudinary image s responsive srcset + blur-up placeholderem.
 * Defenzivní: když není publicId nebo není Cloudinary nakonfigurováno,
 * vykreslí vizuální placeholder (ne rozbitý <img>).
 */
export function CloudinaryImage({
  publicId,
  alt,
  width,
  height,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className,
  variant = {},
  widths = GALLERY_WIDTHS,
  priority = false,
  aspectClass,
  fallbackLabel,
}: CloudinaryImageProps) {
  const canRender = Boolean(publicId) && CLOUDINARY_CONFIGURED;

  if (!canRender) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          aspectClass ?? "aspect-[4/3]",
          className,
        )}
        role="img"
        aria-label={alt || fallbackLabel || "Fotografie není k dispozici"}
      >
        <span className="px-4 text-center text-xs">
          {fallbackLabel ?? "Fotografie není k dispozici"}
        </span>
      </div>
    );
  }

  const pid = publicId as string;
  const targetWidth = width ?? widths[widths.length - 1];
  const src = cldUrl(pid, { ...variant, width: targetWidth });
  const srcSet = cldSrcSet(pid, widths, variant);
  const blur = cldBlur(pid);

  return (
    <picture className={cn("block", aspectClass, className)}>
      <img
        src={src}
        srcSet={srcSet || undefined}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className="h-full w-full object-cover"
        style={
          blur
            ? {
                backgroundImage: `url("${blur}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />
    </picture>
  );
}
