import {
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Path,
  Shape as OutlineShape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Shape, Vec2 } from "@/lib/assemblies/types";

const ROUND_SEGMENTS = 48;

const toVectors = (points: Vec2[]) => points.map(([x, y]) => new Vector2(x, y));

/** Sharp-cornered lathe: one band per profile segment, so each face keeps its own shading. */
function sharpLathe(profile: Vec2[]): BufferGeometry {
  const bands = profile
    .slice(1)
    .map((point, i) => new LatheGeometry(toVectors([profile[i]!, point]), ROUND_SEGMENTS));
  const merged = mergeGeometries(bands);
  bands.forEach((band) => band.dispose());
  return merged;
}

function helix(radius: number, turns: number, height: number): CatmullRomCurve3 {
  const steps = Math.round(turns * 16);
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return new Vector3(radius * Math.cos(a), (i / steps - 0.5) * height, radius * Math.sin(a));
  });
  return new CatmullRomCurve3(points);
}

/** Builds the three.js geometry for one shape of a model. */
export function buildGeometry(shape: Shape): BufferGeometry {
  switch (shape.kind) {
    case "box": {
      const [x, y, z] = shape.size;
      const radius = Math.min(shape.radius ?? 0, x / 2, y / 2, z / 2);
      return new RoundedBoxGeometry(x, y, z, radius > 0 ? 4 : 1, radius);
    }
    case "cylinder":
      return new CylinderGeometry(...shape.args, ROUND_SEGMENTS);
    case "lathe":
      return shape.smooth
        ? new LatheGeometry(toVectors(shape.profile), ROUND_SEGMENTS)
        : sharpLathe(shape.profile);
    case "extrude": {
      const outline = new OutlineShape(toVectors(shape.outline));
      for (const hole of shape.holes ?? []) outline.holes.push(new Path(toVectors(hole)));
      const bevel = shape.bevel ?? 0;
      const geometry = new ExtrudeGeometry(outline, {
        depth: shape.depth - 2 * bevel,
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelOffset: -bevel,
        bevelSegments: 3,
      });
      geometry.translate(0, 0, bevel - shape.depth / 2);
      return geometry;
    }
    case "torus": {
      const geometry = new TorusGeometry(shape.radius, shape.tube, 16, ROUND_SEGMENTS);
      geometry.rotateX(Math.PI / 2);
      return geometry;
    }
    case "sphere":
      return new SphereGeometry(shape.radius, 32, 20);
    case "coil":
      return new TubeGeometry(
        helix(shape.radius, shape.turns, shape.height),
        Math.round(shape.turns * 32),
        shape.wire,
        10,
      );
    case "surface": {
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new Float32BufferAttribute(shape.positions, 3));
      geometry.setIndex(shape.indices);
      geometry.computeVertexNormals();
      return geometry;
    }
  }
}
