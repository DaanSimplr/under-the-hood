import { brakeCorner } from "./brake-corner";
import type { Assembly } from "./types";

export const assemblies = { "brake-corner": brakeCorner } as const satisfies Record<
  string,
  Assembly
>;
export type AssemblyId = keyof typeof assemblies;
export const ASSEMBLY_IDS = Object.keys(assemblies) as AssemblyId[];

export function getAssembly(id: string): Assembly | undefined {
  return (assemblies as Record<string, Assembly>)[id];
}

/** Part ids that appear in any assembly, mapped to the assembly id. */
export function assemblyForPart(partId: string): AssemblyId | undefined {
  return ASSEMBLY_IDS.find((id) => assemblies[id].pieces.some((p) => p.partId === partId));
}

export type { Assembly, AssemblyPiece } from "./types";
