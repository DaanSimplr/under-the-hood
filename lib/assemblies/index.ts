import { brakeCorner } from "./brake-corner";
import { clutchGearbox } from "./clutch-gearbox";
import { cylinder } from "./cylinder";
import { drivetrain } from "./drivetrain";
import { engine } from "./engine";
import type { Assembly } from "./types";

/**
 * Every exploded view. A system page shows the ones that contain its parts, in
 * this order, so an overview comes before its close-up.
 */
export const assemblies = {
  "brake-corner": brakeCorner,
  engine,
  cylinder,
  drivetrain,
  "clutch-gearbox": clutchGearbox,
} as const satisfies Record<string, Assembly>;
export type AssemblyId = keyof typeof assemblies;
export const ASSEMBLY_IDS = Object.keys(assemblies) as AssemblyId[];

export function getAssembly(id: string): Assembly | undefined {
  return (assemblies as Record<string, Assembly>)[id];
}

/**
 * The exploded view to show on a part's page: the last one that contains the
 * part, which is the closest look at it (close-ups come after overviews).
 */
export function assemblyForPart(partId: string): AssemblyId | undefined {
  return [...ASSEMBLY_IDS]
    .reverse()
    .find((id) => assemblies[id].pieces.some((p) => p.partId === partId));
}

export type { Assembly, AssemblyPiece } from "./types";
