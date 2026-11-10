import type { ResolvedSlot } from "@/lib/assets";
import type { ClientSlot } from "./types";

/** Strips a resolved slot down to plain, serializable data for client components. */
export function toClientSlot(r: ResolvedSlot): ClientSlot {
  const [w, h] = r.slot.resolution?.split("x").map(Number) ?? [];
  return {
    id: r.slot.id,
    type: r.slot.type,
    role: r.slot.role,
    alt: r.slot.alt,
    aspectCss: r.aspectCss,
    loop: r.slot.loop ?? true,
    durationSec: r.slot.durationSec ?? null,
    src: r.src,
    webmSrc: r.webmSrc,
    posterSrc: r.posterSrc,
    srcSet: r.srcSet,
    width: w ?? null,
    height: h ?? null,
  };
}
