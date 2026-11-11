"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/components/media/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import type { ModelCanvasProps } from "./ExplodedViewCanvas";

/** The Three.js scene lives in its own chunk and is only fetched when needed. */
const ExplodedViewCanvas = dynamic(() => import("./ExplodedViewCanvas"), {
  ssr: false,
  loading: () => <CanvasMessage>Loading 3D view…</CanvasMessage>,
});

function CanvasMessage({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted">
      {children}
    </div>
  );
}

class WebGLBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <CanvasMessage>{this.props.fallback}</CanvasMessage>
    ) : (
      this.props.children
    );
  }
}

/**
 * The frame around a 3D model. It loads the Three.js chunk only when the frame
 * comes near the viewport, and shows a message if WebGL cannot start.
 */
export function ModelStage({
  label,
  fallback,
  className,
  ...canvas
}: Omit<ModelCanvasProps, "reducedMotion"> & {
  /** Text alternative for the whole view. */
  label: string;
  /** Shown if the 3D view cannot start. Point to where the same information is. */
  fallback: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no observer: load straight away
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={label}
      className={cn("relative overflow-hidden rounded-lg bg-surface-2", className)}
    >
      {inView ? (
        <WebGLBoundary fallback={`The 3D view could not start on this device. ${fallback}`}>
          <ExplodedViewCanvas {...canvas} reducedMotion={reducedMotion} />
        </WebGLBoundary>
      ) : (
        <CanvasMessage>3D view loads when you scroll here.</CanvasMessage>
      )}
    </div>
  );
}

const pillButton =
  "min-h-10 rounded-full border border-border px-3 text-sm hover:bg-surface-2 aria-pressed:border-fg aria-pressed:bg-fg aria-pressed:text-bg";

export function PillButton({
  pressed,
  onClick,
  children,
}: {
  /** Set for on/off buttons. */
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className={pillButton}>
      {children}
    </button>
  );
}

/** Slider plus Assemble/Explode buttons. `children` adds more buttons to the row. */
export function ExplodeControls({
  explode,
  onChange,
  children,
}: {
  explode: number;
  onChange: (explode: number) => void;
  children?: ReactNode;
}) {
  const id = useId();
  const pct = Math.round(explode * 100);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <label htmlFor={id} className="text-sm font-semibold">
        Explode
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        aria-valuetext={pct === 0 ? "Assembled" : `${pct}% apart`}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-10 min-w-40 flex-1 accent-[var(--accent)]"
      />
      <div className="flex flex-wrap gap-2">
        <PillButton onClick={() => onChange(0)}>Assemble</PillButton>
        <PillButton onClick={() => onChange(1)}>Explode</PillButton>
        {children}
      </div>
    </div>
  );
}
