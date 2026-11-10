"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import type { Assembly, AssemblyPiece } from "@/lib/assemblies";
import type { Shape, Tone, Vec3 } from "@/lib/assemblies/types";

type Palette = Record<Tone, string> & { highlight: string };

const FALLBACK: Palette = {
  steel: "#a3abb5",
  "cast-iron": "#8b919a",
  dark: "#555b65",
  friction: "#8c6a4a",
  accent: "#c62828",
  highlight: "#ff8a4c",
};

/** Whole assembly is shifted down so the exploded caliper stays in frame. */
const ROOT_OFFSET: Vec3 = [0, -0.6, 0];

/** Reads token colors from CSS so the 3D view follows the theme. */
function usePalette(): Palette {
  const [palette, setPalette] = useState(FALLBACK);
  useEffect(() => {
    const read = () => {
      const css = getComputedStyle(document.documentElement);
      const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
      setPalette({
        ...FALLBACK,
        accent: v("--sys-brakes", FALLBACK.accent),
        highlight: v("--accent", FALLBACK.highlight),
      });
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return palette;
}

function offsetFor(piece: AssemblyPiece, explode: number): Vec3 {
  const [x, y, z] = piece.explodeOffset;
  return [x * explode, y * explode, z * explode];
}

function ShapeMesh({ shape, color, glow }: { shape: Shape; color: string; glow: string | null }) {
  return (
    <mesh position={shape.position} rotation={shape.rotation ?? [0, 0, 0]}>
      {shape.kind === "box" ? (
        <boxGeometry args={shape.size} />
      ) : (
        <cylinderGeometry args={[...shape.args, 40]} />
      )}
      <meshStandardMaterial
        color={color}
        metalness={0.1}
        roughness={0.6}
        emissive={glow ?? "#000000"}
        emissiveIntensity={glow ? 0.45 : 0}
      />
    </mesh>
  );
}

/**
 * Projects each label's 3D anchor to screen space on every rendered frame and
 * moves the matching DOM label. Plain DOM labels stay crisp and theme-aware.
 */
function LabelProjector({
  pieces,
  explode,
  labels,
}: {
  pieces: AssemblyPiece[];
  explode: number;
  labels: React.RefObject<Map<string, HTMLSpanElement>>;
}) {
  const v = useRef(new Vector3());
  useFrame(({ camera, size }) => {
    for (const piece of pieces) {
      const el = labels.current?.get(piece.id);
      if (!el) continue;
      const o = offsetFor(piece, explode);
      v.current
        .set(
          piece.labelAt[0] + o[0] + ROOT_OFFSET[0],
          piece.labelAt[1] + o[1] + ROOT_OFFSET[1],
          piece.labelAt[2] + o[2] + ROOT_OFFSET[2],
        )
        .project(camera);
      const x = ((v.current.x + 1) / 2) * size.width;
      const y = ((1 - v.current.y) / 2) * size.height;
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      el.style.visibility = v.current.z > 1 ? "hidden" : "visible";
    }
  });
  return null;
}

export default function ExplodedViewCanvas({
  assembly,
  explode,
  highlightPartId,
  highlightPieceId,
}: {
  assembly: Assembly;
  explode: number;
  highlightPartId?: string;
  highlightPieceId?: string;
}) {
  const palette = usePalette();
  const labels = useRef(new Map<string, HTMLSpanElement>());
  const isHighlighted = (piece: AssemblyPiece) =>
    piece.id === highlightPieceId || (!!highlightPartId && piece.partId === highlightPartId);

  return (
    <div className="absolute inset-0">
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [5.6, 3.2, 7.2], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        aria-hidden="true"
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[5, 8, 6]} intensity={1.6} />
        <directionalLight position={[-6, 2, -4]} intensity={0.5} />
        <group position={ROOT_OFFSET}>
          {assembly.pieces.map((piece) => (
            <group key={piece.id} position={offsetFor(piece, explode)}>
              {piece.shapes.map((shape, i) => (
                <ShapeMesh
                  key={i}
                  shape={shape}
                  color={palette[shape.tone]}
                  glow={isHighlighted(piece) ? palette.highlight : null}
                />
              ))}
            </group>
          ))}
        </group>
        <LabelProjector pieces={assembly.pieces} explode={explode} labels={labels} />
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={4}
          maxDistance={14}
          target={[0.3, 1, 0]}
        />
      </Canvas>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {assembly.pieces.map((piece) => (
          <span
            key={piece.id}
            ref={(el) => {
              if (el) labels.current.set(piece.id, el);
              else labels.current.delete(piece.id);
            }}
            style={{ visibility: "hidden" }}
            className={
              "absolute top-0 left-0 rounded px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap shadow-sm " +
              (isHighlighted(piece) ? "bg-accent text-accent-fg" : "bg-surface/90 text-fg")
            }
          >
            {piece.removalOrder}. {piece.label}
          </span>
        ))}
      </div>
    </div>
  );
}
