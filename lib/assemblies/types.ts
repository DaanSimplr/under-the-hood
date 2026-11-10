export type Vec3 = [number, number, number];

/** Material tones. The 3D view maps these to colors. */
export type Tone = "steel" | "cast-iron" | "dark" | "friction" | "accent";

export type Shape =
  | { kind: "box"; size: Vec3; position: Vec3; rotation?: Vec3; tone: Tone }
  | {
      kind: "cylinder";
      /** radiusTop, radiusBottom, height. Cylinders point along +Y before rotation. */
      args: [number, number, number];
      position: Vec3;
      rotation?: Vec3;
      tone: Tone;
    };

export type AssemblyPiece = {
  id: string;
  label: string;
  /** Link to a part page, when the piece is a part in the content. */
  partId?: string;
  /** 1 = comes off first. Pieces that come off together share a number. */
  removalOrder: number;
  /** Where the piece sits when fully exploded, relative to its rest position. */
  explodeOffset: Vec3;
  /** Where the label is drawn, relative to the piece's rest position. */
  labelAt: Vec3;
  shapes: Shape[];
  description: string;
};

export type Assembly = {
  id: string;
  title: string;
  /** One-line note on what is simplified. */
  note: string;
  /** Axis note shown to readers, e.g. "Outboard (wheel side) is to the right". */
  orientation: string;
  pieces: AssemblyPiece[];
};
