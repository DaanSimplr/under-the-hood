import { resolveSlot } from "@/lib/assets";
import { ImageSlot } from "./ImageSlot";
import { PlaceholderMedia } from "./PlaceholderMedia";
import { toClientSlot } from "./toClientSlot";
import { VideoLoop } from "./VideoLoop";

/**
 * The only way pages show media. Looks the slot up in public/media/assets.json
 * at build time. Unknown ids throw (in dev and during the build). Slots that are
 * still "placeholder", or whose file is missing, render a labelled placeholder.
 */
export function MediaSlot({
  id,
  priority = false,
  fill = false,
  sizes,
  className,
}: {
  id: string;
  /** Above the fold: load eagerly. */
  priority?: boolean;
  /** Fill the positioned parent instead of keeping the slot's aspect ratio. */
  fill?: boolean;
  sizes?: string;
  className?: string;
}) {
  const resolved = resolveSlot(id);
  const slot = toClientSlot(resolved);

  if (!resolved.available) {
    return (
      <PlaceholderMedia
        slotId={id}
        role={slot.role}
        aspectCss={slot.aspectCss}
        alt={slot.alt}
        fill={fill}
        className={className}
      />
    );
  }
  if (slot.type === "image") {
    return (
      <ImageSlot slot={slot} priority={priority} fill={fill} sizes={sizes} className={className} />
    );
  }
  return <VideoLoop slot={slot} priority={priority} fill={fill} className={className} />;
}
