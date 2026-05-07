import {
  cldUrl,
  cldSrcSet,
  cldBlur,
  GALLERY_WIDTHS,
  CLOUDINARY_CONFIGURED,
  type CldQuality,
  type CldVariant,
} from "@/lib/cloudinary-url";
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
  /**
   * Pokud `true`, obrázek se vyrenderuje s `loading="eager"` a `fetchPriority="high"`.
   * Použij pouze pro LCP / nad foldem first-paint obrázek (1× na public route).
   */
  priority?: boolean;
  /**
   * Vyšší priorita stahování bez `eager`. Vhodné pro „skoro LCP“ obrázky –
   * např. první karta v gridu pod hero. Nepoužívat ve více místech najednou.
   */
  fetchPriority?: "auto" | "high" | "low";
  aspectClass?: string;
  /** Fallback vizuál když nemáme platný publicId nebo chybí Cloudinary config. */
  fallbackLabel?: string;
  /**
   * Vypne blur-up placeholder background. Defaultně blur generujeme jen pro
   * priority obrázky (LCP) – ostatní by jinak vyvolaly další request na velmi
   * malou Cloudinary variantu, což zvýší počet transformací. Komponenta tedy
   * implicitně aplikuje smysluplný default; přepíše se jen tam, kde má smysl.
   */
  disableBlur?: boolean;
}

/**
 * Cloudinary image s responsive srcset + (volitelným) blur-up placeholderem.
 *
 * Defaulty zaměřené na LCP a Free-plan šetrnost:
 *  - blur-up se generuje **jen pro priority** obrázky (LCP); ostatní
 *    nezbytně negenerují další 24px Cloudinary transformaci.
 *  - LCP používá `q_auto:good` pokud jí volající explicitně nepřebije.
 *  - Non-priority obrázky zůstávají `loading="lazy"` + `fetchPriority="auto"`,
 *    což zabraňuje konkurování LCP o bandwidth.
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
  fetchPriority,
  aspectClass,
  fallbackLabel,
  disableBlur,
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

  // LCP defaultně nasaď q_auto:good – ne moc agresivní auto, ale ne best (větší soubor).
  const effectiveQuality: CldQuality | undefined =
    variant.quality ?? (priority ? "auto:good" : undefined);

  const effectiveVariant: CldVariant = {
    ...variant,
    ...(effectiveQuality ? { quality: effectiveQuality } : {}),
  };

  const src = cldUrl(pid, { ...effectiveVariant, width: targetWidth });
  const srcSet = cldSrcSet(pid, widths, effectiveVariant);

  // Blur-up jen pro LCP (a když nás volající nezakázal). Šetří Cloudinary
  // transformations: u stovek non-LCP karet by 24px varianta zbytečně
  // nafukovala počet transformací.
  const showBlur = priority && !disableBlur;
  const blur = showBlur ? cldBlur(pid) : null;

  const imgFetchPriority = fetchPriority ?? (priority ? "high" : "auto");

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
        fetchPriority={imgFetchPriority}
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
