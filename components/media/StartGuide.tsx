"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlaceholderMedia } from "./PlaceholderMedia";
import type { ClientSlot } from "./types";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * "Start guide" button. Plays the one-shot transition slot (if it is ready and
 * motion is allowed), then moves focus to the steps. In development a
 * placeholder slot flashes briefly so its position can be checked.
 */
export function StartGuide({
  transition,
  available,
  previewPlaceholder,
  targetId,
}: {
  transition: ClientSlot;
  available: boolean;
  previewPlaceholder: boolean;
  targetId: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);

  const goToSteps = useCallback(() => {
    setPlaying(false);
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    target.focus({ preventScroll: true });
  }, [reducedMotion, targetId]);

  useEffect(() => {
    if (!playing) return;
    skipRef.current?.focus();
    const ms = available ? ((transition.durationSec ?? 2) + 1.5) * 1000 : 700;
    const timer = window.setTimeout(goToSteps, ms);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && goToSteps();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [playing, available, transition.durationSec, goToSteps]);

  function start() {
    const canPlay = !reducedMotion && (available || previewPlaceholder);
    if (canPlay) setPlaying(true);
    else goToSteps();
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg hover:opacity-90"
      >
        Start the guide
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </button>
      {playing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Starting the guide"
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg"
        >
          <div className="relative aspect-video w-full max-w-5xl">
            {available ? (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                playsInline
                poster={transition.posterSrc ?? undefined}
                onEnded={goToSteps}
                onError={goToSteps}
                aria-hidden="true"
              >
                {transition.webmSrc && <source src={transition.webmSrc} type="video/webm" />}
                {transition.src && <source src={transition.src} type="video/mp4" />}
              </video>
            ) : (
              <PlaceholderMedia
                slotId={transition.id}
                role={transition.role}
                aspectCss={transition.aspectCss}
                fill
              />
            )}
          </div>
          <button
            ref={skipRef}
            type="button"
            onClick={goToSteps}
            className="absolute top-4 right-4 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium"
          >
            Skip
          </button>
        </div>
      )}
    </>
  );
}
