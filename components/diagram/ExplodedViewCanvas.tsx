"use client";

import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import {
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector3,
  type Group,
  type Material,
} from "three";
import {
  boundsCenter,
  boundsRadius,
  fitDistance,
  labelAnchor,
  mixBounds,
  modelBounds,
  pieceOffset,
} from "@/lib/assemblies/geometry";
import type { ModelPiece, Tone, Vec3 } from "@/lib/assemblies/types";
import { cn } from "@/lib/cn";
import { buildGeometry } from "./shapeGeometry";

export type ModelLabel = { id: string; text: string };

export type ModelCanvasProps = {
  pieces: ModelPiece[];
  /** Direction from the model towards the camera at the start and after a reset. */
  camera: Vec3;
  /** 0 = assembled, 1 = fully apart. The pieces glide to this value. */
  explode: number;
  reducedMotion: boolean;
  highlightIds: string[];
  hoverId: string | null;
  /** Pieces drawn faint and click-through, so what is behind them shows. */
  ghostIds?: string[];
  labels: ModelLabel[];
  /** Change this to put the camera back where it started. */
  resetKey?: number;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
};

type PieceState = "normal" | "hover" | "highlight" | "ghost";
type Materials = Record<Tone, Record<PieceState, Material>>;
type Palette = Record<Tone, string> & { highlight: string };

/** How each tone reflects light. Colors come from the `--model-*` tokens. */
const FINISH: Record<Tone, { metalness: number; roughness: number; token: string }> = {
  steel: { metalness: 0.9, roughness: 0.35, token: "--model-steel" },
  "cast-iron": { metalness: 0.65, roughness: 0.6, token: "--model-cast-iron" },
  aluminium: { metalness: 0.85, roughness: 0.4, token: "--model-aluminium" },
  dark: { metalness: 0.4, roughness: 0.55, token: "--model-dark" },
  plastic: { metalness: 0, roughness: 0.65, token: "--model-plastic" },
  rubber: { metalness: 0, roughness: 0.9, token: "--model-rubber" },
  friction: { metalness: 0, roughness: 0.95, token: "--model-friction" },
  fabric: { metalness: 0, roughness: 1, token: "--model-fabric" },
  paint: { metalness: 0.5, roughness: 0.35, token: "--model-paint" },
  glass: { metalness: 0, roughness: 0.05, token: "--model-glass" },
  lamp: { metalness: 0, roughness: 0.2, token: "--model-lamp" },
  accent: { metalness: 0.3, roughness: 0.45, token: "--sys-brakes" },
};
const TONES = Object.keys(FINISH) as Tone[];
const STATES: PieceState[] = ["normal", "hover", "highlight", "ghost"];
const GLOW: Record<PieceState, number> = { normal: 0, hover: 0.22, highlight: 0.5, ghost: 0 };

const FOV = 32;
/** The fit is to the box around the model, which is roomier than the model itself. */
const MARGIN = 1;
/** Labels closer together than this (in pixels) are stacked instead of overlapping. */
const LABEL_HEIGHT = 24;
const TWIN = "#twin";

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const read = (token: string) => css.getPropertyValue(token).trim();
  const tones = Object.fromEntries(TONES.map((tone) => [tone, read(FINISH[tone].token)]));
  return { ...(tones as Record<Tone, string>), highlight: read("--accent") };
}

/** Reads token colors from CSS so the 3D view follows the theme. */
function usePalette(): Palette {
  const [palette, setPalette] = useState(readPalette);
  useEffect(() => {
    const mo = new MutationObserver(() => setPalette(readPalette()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return palette;
}

function buildMaterial(tone: Tone, state: PieceState, palette: Palette): Material {
  const { metalness, roughness } = FINISH[tone];
  const material =
    tone === "paint"
      ? new MeshPhysicalMaterial({ clearcoat: 1, clearcoatRoughness: 0.2 })
      : new MeshStandardMaterial();
  material.color.set(palette[tone]);
  material.metalness = metalness;
  material.roughness = roughness;
  material.side = DoubleSide;
  material.emissive.set(palette.highlight);
  material.emissiveIntensity = GLOW[state];
  if (state === "ghost" || tone === "glass") {
    material.transparent = true;
    material.opacity = state === "ghost" ? 0.06 : 0.42;
    material.depthWrite = false;
  }
  return material;
}

function buildMaterials(palette: Palette): Materials {
  const byTone = TONES.map((tone) => [
    tone,
    Object.fromEntries(STATES.map((state) => [state, buildMaterial(tone, state, palette)])),
  ]);
  return Object.fromEntries(byTone) as Materials;
}

function Piece({
  piece,
  state,
  materials,
  groups,
  onHover,
  onSelect,
}: {
  piece: ModelPiece;
  state: PieceState;
  materials: Materials;
  groups: React.RefObject<Map<string, Group>>;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
}) {
  const geometries = useMemo(() => piece.shapes.map(buildGeometry), [piece]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);

  const solid = state !== "ghost";
  const meshes = piece.shapes.map((shape, i) => (
    <mesh
      key={i}
      geometry={geometries[i]}
      material={materials[shape.tone][state]}
      position={shape.position}
      rotation={shape.rotation}
      castShadow={solid && shape.tone !== "glass"}
      receiveShadow={solid}
    />
  ));
  // Ghost pieces get no handlers, so pointer events pass through to what is behind them.
  const handlers = solid
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover(piece.id);
        },
        onPointerOut: () => onHover(null),
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          // A drag to rotate the view also ends in a click; ignore those.
          if (e.delta <= 4) onSelect(piece.id);
        },
      }
    : {};
  const register = (key: string) => (el: Group | null) => {
    if (el) groups.current.set(key, el);
    else groups.current.delete(key);
  };

  return (
    <>
      <group ref={register(piece.id)} {...handlers}>
        {meshes}
      </group>
      {piece.mirror && (
        <group ref={register(piece.id + TWIN)} scale={[1, 1, -1]} {...handlers}>
          {meshes}
        </group>
      )}
    </>
  );
}

/**
 * Moves the pieces, the camera and the labels on every rendered frame. The
 * pieces glide towards the explode amount; the camera keeps the whole model in
 * view while keeping the angle and zoom the visitor chose; each DOM label
 * follows its piece. Plain DOM labels stay crisp and theme-aware.
 */
function Stage({
  pieces,
  camera: cameraDirection,
  explode,
  reducedMotion,
  labels,
  resetKey = 0,
  groups,
  labelEls,
}: Pick<
  ModelCanvasProps,
  "pieces" | "camera" | "explode" | "reducedMotion" | "labels" | "resetKey"
> & {
  groups: React.RefObject<Map<string, Group>>;
  labelEls: React.RefObject<Map<string, HTMLSpanElement>>;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const current = useRef(explode);
  const framed = useRef<{ fit: number; resetKey: number } | null>(null);
  const scratch = useRef({ center: new Vector3(), offset: new Vector3(), point: new Vector3() });
  const byId = useMemo(() => new Map(pieces.map((p) => [p.id, p])), [pieces]);
  const extent = useMemo(() => {
    const rest = modelBounds(pieces, 0);
    const apart = modelBounds(pieces, 1);
    const reach = boundsRadius(apart) + Math.hypot(...boundsCenter(apart));
    return { rest, apart, reach };
  }, [pieces]);

  // The canvas only draws on demand, so ask for a frame whenever something changed.
  useEffect(() => invalidate());

  useFrame((state, delta) => {
    const gap = explode - current.current;
    if (reducedMotion || Math.abs(gap) < 0.001) current.current = explode;
    else {
      current.current += gap * (1 - Math.exp(-Math.min(delta, 0.05) * 9));
      state.invalidate();
    }
    const t = current.current;

    for (const piece of pieces) {
      groups.current.get(piece.id)?.position.set(...pieceOffset(piece, t));
      if (piece.mirror)
        groups.current.get(piece.id + TWIN)?.position.set(...pieceOffset(piece, t, true));
    }

    const orbit = controls.current;
    if (orbit) {
      const bounds = mixBounds(extent.rest, extent.apart, t);
      const { center, offset } = scratch.current;
      const aspect = state.size.width / state.size.height;
      const fit = fitDistance(bounds, cameraDirection, FOV, aspect) * MARGIN;
      center.set(...boundsCenter(bounds));
      if (framed.current?.resetKey === resetKey)
        offset
          .copy(state.camera.position)
          .sub(orbit.target)
          .multiplyScalar(fit / framed.current.fit);
      else
        offset
          .set(...cameraDirection)
          .normalize()
          .multiplyScalar(fit);
      orbit.target.copy(center);
      state.camera.position.copy(center).add(offset);
      orbit.update();
      framed.current = { fit, resetKey };
    }

    const { point } = scratch.current;
    const placed: Array<{ el: HTMLSpanElement; x: number; y: number; width: number }> = [];
    for (const { id } of labels) {
      const el = labelEls.current.get(id);
      const piece = byId.get(id);
      if (!el || !piece) continue;
      const [ax, ay, az] = labelAnchor(piece);
      const [ox, oy, oz] = pieceOffset(piece, t);
      point.set(ax + ox, ay + oy, az + oz).project(state.camera);
      el.style.visibility = point.z > 1 ? "hidden" : "visible";
      placed.push({
        el,
        x: ((point.x + 1) / 2) * state.size.width,
        y: ((1 - point.y) / 2) * state.size.height,
        width: el.offsetWidth,
      });
    }
    // Stack labels that would overlap, working down the screen.
    placed.sort((a, b) => a.y - b.y);
    placed.forEach((label, i) => {
      for (const above of placed.slice(0, i))
        if (
          Math.abs(above.x - label.x) < (above.width + label.width) / 2 + 4 &&
          Math.abs(above.y - label.y) < LABEL_HEIGHT
        )
          label.y = above.y + LABEL_HEIGHT;
      label.el.style.transform = `translate(-50%, -130%) translate(${label.x}px, ${label.y}px)`;
    });
  });

  const { rest, reach } = extent;
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[reach * 0.5, reach * 1.6, reach * 0.9]}
        intensity={2.2}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-reach}
        shadow-camera-right={reach}
        shadow-camera-top={reach}
        shadow-camera-bottom={-reach}
        shadow-camera-near={0.1}
        shadow-camera-far={reach * 5}
      />
      {/* A small studio made of light panels, so metal and paint have something to reflect. */}
      <Environment resolution={256}>
        <Lightformer
          form="rect"
          intensity={2.5}
          position={[0, 6, 0]}
          scale={[12, 12, 1]}
          rotation-x={Math.PI / 2}
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          position={[-7, 2, 4]}
          scale={[8, 5, 1]}
          rotation-y={Math.PI / 2}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          position={[7, 2, -4]}
          scale={[8, 5, 1]}
          rotation-y={-Math.PI / 2}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          position={[0, 2, 8]}
          scale={[10, 4, 1]}
          rotation-y={Math.PI}
        />
      </Environment>
      <mesh rotation-x={-Math.PI / 2} position-y={rest.min[1] - 0.002} receiveShadow>
        <planeGeometry args={[reach * 6, reach * 6]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableDamping
        minDistance={boundsRadius(rest) * 0.5}
        maxDistance={reach * 5}
        maxPolarAngle={Math.PI * 0.55}
      />
    </>
  );
}

export default function ExplodedViewCanvas({
  pieces,
  camera,
  explode,
  reducedMotion,
  highlightIds,
  hoverId,
  ghostIds,
  labels,
  resetKey,
  onHover,
  onSelect,
}: ModelCanvasProps) {
  const palette = usePalette();
  const materials = useMemo(() => buildMaterials(palette), [palette]);
  useEffect(
    () => () =>
      Object.values(materials).forEach((states) =>
        Object.values(states).forEach((m) => m.dispose()),
      ),
    [materials],
  );
  const groups = useRef(new Map<string, Group>());
  const labelEls = useRef(new Map<string, HTMLSpanElement>());

  const stateOf = (id: string): PieceState =>
    ghostIds?.includes(id)
      ? "ghost"
      : highlightIds.includes(id)
        ? "highlight"
        : id === hoverId
          ? "hover"
          : "normal";

  return (
    <div className={cn("absolute inset-0", hoverId && "cursor-pointer")}>
      <Canvas
        shadows="percentage"
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ fov: FOV, near: 0.05, far: 200 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => onSelect(null)}
        aria-hidden="true"
      >
        {pieces.map((piece) => (
          <Piece
            key={piece.id}
            piece={piece}
            state={stateOf(piece.id)}
            materials={materials}
            groups={groups}
            onHover={onHover}
            onSelect={onSelect}
          />
        ))}
        <Stage
          pieces={pieces}
          camera={camera}
          explode={explode}
          reducedMotion={reducedMotion}
          labels={labels}
          resetKey={resetKey}
          groups={groups}
          labelEls={labelEls}
        />
      </Canvas>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {labels.map((label) => (
          <span
            key={label.id}
            ref={(el) => {
              if (el) labelEls.current.set(label.id, el);
              else labelEls.current.delete(label.id);
            }}
            style={{ visibility: "hidden" }}
            className={cn(
              "absolute top-0 left-0 rounded px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap shadow-sm",
              highlightIds.includes(label.id)
                ? "bg-accent text-accent-fg"
                : "bg-surface/90 text-fg",
            )}
          >
            {label.text}
          </span>
        ))}
      </div>
    </div>
  );
}
