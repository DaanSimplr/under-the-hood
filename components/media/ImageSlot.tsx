"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { PlaceholderMedia } from "./PlaceholderMedia";
import type { ClientSlot } from "./types";

export function ImageSlot({
  slot,
  priority = false,
  fill = false,
  sizes = "100vw",
  className,
}: {
  slot: ClientSlot;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !slot.src) {
    return (
      <PlaceholderMedia
        slotId={slot.id}
        role={slot.role}
        aspectCss={slot.aspectCss}
        alt={slot.alt}
        fill={fill}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export: manifest-driven responsive <img>
    <img
      src={slot.src}
      srcSet={slot.srcSet ?? undefined}
      sizes={slot.srcSet ? sizes : undefined}
      alt={slot.alt}
      aria-hidden={slot.alt ? undefined : true}
      width={slot.width ?? undefined}
      height={slot.height ?? undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      data-media-slot={slot.id}
      data-media-state="ready"
      onError={() => setFailed(true)}
      className={cn(
        "object-cover",
        fill ? "absolute inset-0 h-full w-full" : "h-auto w-full",
        className,
      )}
      style={fill ? undefined : { aspectRatio: slot.aspectCss }}
    />
  );
}
