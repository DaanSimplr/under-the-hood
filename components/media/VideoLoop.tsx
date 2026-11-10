"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { PlaceholderMedia } from "./PlaceholderMedia";
import type { ClientSlot } from "./types";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Decorative video. The poster renders first (also in the static HTML). The
 * <video> is attached only once it is near the viewport (or right away for
 * `priority`), and never when the user prefers reduced motion.
 */
export function VideoLoop({
  slot,
  priority = false,
  fill = false,
  className,
}: {
  slot: ClientSlot;
  priority?: boolean;
  fill?: boolean;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [nearViewport, setNearViewport] = useState(priority);
  const [visible, setVisible] = useState(priority);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setNearViewport(true);
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pause when scrolled away to save battery; resume when back.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (visible) v.play().catch(() => {});
    else v.pause();
  }, [visible]);

  if (failed || (!slot.src && !slot.webmSrc)) {
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

  const showVideo = nearViewport && !reducedMotion;
  const a11y = slot.alt
    ? { role: "img" as const, "aria-label": slot.alt }
    : { "aria-hidden": true as const };
  const mediaClass = "absolute inset-0 h-full w-full object-cover";

  return (
    <div
      ref={wrapperRef}
      {...a11y}
      data-media-slot={slot.id}
      data-media-state={showVideo ? "video" : "poster"}
      className={cn(
        "relative overflow-hidden bg-surface-2",
        fill ? "absolute inset-0 h-full w-full" : "w-full",
        className,
      )}
      style={fill ? undefined : { aspectRatio: slot.aspectCss }}
    >
      {slot.posterSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- poster frame from the manifest
        <img
          src={slot.posterSrc}
          alt=""
          className={mediaClass}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
        />
      ) : (
        <PlaceholderMedia
          slotId={slot.id}
          role={slot.role}
          aspectCss={slot.aspectCss}
          fill
          showLabel={false}
        />
      )}
      {showVideo && (
        <video
          ref={(el) => {
            videoRef.current = el;
            if (el) {
              // Set as a property too: autoplay is only allowed for muted video.
              el.muted = true;
              if (visible) el.play().catch(() => {});
            }
          }}
          className={mediaClass}
          autoPlay
          muted
          loop={slot.loop}
          playsInline
          preload={priority ? "auto" : "metadata"}
          poster={slot.posterSrc ?? undefined}
          tabIndex={-1}
        >
          {slot.webmSrc && <source src={slot.webmSrc} type="video/webm" />}
          {slot.src && <source src={slot.src} type="video/mp4" onError={() => setFailed(true)} />}
        </video>
      )}
    </div>
  );
}
