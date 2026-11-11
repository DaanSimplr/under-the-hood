export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

/** Material tones. The 3D view maps these to colors (the `--model-*` tokens) and surface finishes. */
export type Tone =
  | "steel"
  | "cast-iron"
  | "aluminium"
  | "dark"
  | "plastic"
  | "rubber"
  | "friction"
  | "fabric"
  | "paint"
  | "glass"
  | "lamp"
  | "accent";

type Placement = {
  /** Defaults to the origin. */
  position?: Vec3;
  /** Euler angles in radians, applied in three.js order (Z first, then Y, then X). */
  rotation?: Vec3;
  tone: Tone;
};

/** Every round shape has its axis along +Y before rotation. */
export type Shape = Placement &
  (
    | { kind: "box"; size: Vec3; /** Corner radius. */ radius?: number }
    | { kind: "cylinder"; /** radiusTop, radiusBottom, height. */ args: Vec3 }
    | {
        kind: "lathe";
        /** [radius, height] points swept around the Y axis. Repeat the first point to close it. */
        profile: Vec2[];
        /** Blend the corners of the profile (tyres, boots). Default: sharp corners. */
        smooth?: boolean;
      }
    | {
        kind: "extrude";
        /** Outline in the XY plane, pushed along Z and centred on it. */
        outline: Vec2[];
        holes?: Vec2[][];
        depth: number;
        /** Rounds the front and back edges by this much, inside the outline. */
        bevel?: number;
      }
    | { kind: "torus"; radius: number; tube: number }
    | { kind: "sphere"; radius: number }
    | { kind: "coil"; radius: number; wire: number; turns: number; height: number }
    | { kind: "surface"; positions: number[]; indices: number[] }
  );

export type ModelPiece = {
  id: string;
  label: string;
  /** Link to a part page, when the piece is a part in the content. */
  partId?: string;
  /** Where the piece sits when fully exploded, relative to its rest position. */
  explodeOffset: Vec3;
  /** Where the label is drawn, relative to the rest position. Default: just above the piece. */
  labelAt?: Vec3;
  /** Also draw a twin on the other side of the centre plane (z becomes -z). */
  mirror?: boolean;
  shapes: Shape[];
  description: string;
};

export type AssemblyPiece = ModelPiece & {
  /** 1 = comes off first. Pieces that come off together share a number. */
  removalOrder: number;
};

export type Assembly = {
  id: string;
  title: string;
  /** One-line note on what is simplified. */
  note: string;
  /** Axis note shown to readers, e.g. "Outboard (wheel side) is to the right". */
  orientation: string;
  /** Direction from the model towards the camera at the start. */
  camera: Vec3;
  pieces: AssemblyPiece[];
};

export type CarPiece = ModelPiece & {
  systemId: string;
  /** Outer bodywork: can be made see-through to show what is underneath. */
  body?: boolean;
};

export type CarModel = {
  note: string;
  camera: Vec3;
  pieces: CarPiece[];
};
