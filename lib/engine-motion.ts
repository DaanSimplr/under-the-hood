/**
 * Timing of the exploded-engine backdrop loop. Pure, so the client animator
 * stays small and the timing can be unit tested.
 */

/** Seconds per phase: hold assembled, explode, hold exploded, reassemble, settle. */
export const LOOP_PHASES = [1.6, 3.6, 4.4, 3.2, 0.6] as const;
export const LOOP_SECONDS = LOOP_PHASES.reduce((a, b) => a + b, 0);
/** Where the "hold exploded" phase starts. The static HTML shows this state. */
export const EXPLODED_AT = LOOP_PHASES[0] + LOOP_PHASES[1];

/** Explosion progress (0 = assembled, 1 = exploded) at a time in the loop. */
export function loopProgress(seconds: number): number {
  const [hold, explode, exploded, assemble] = LOOP_PHASES;
  const t = ((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
  if (t < hold) return 0;
  if (t < hold + explode) return (t - hold) / explode;
  if (t < hold + explode + exploded) return 1;
  if (t < hold + explode + exploded + assemble)
    return 1 - (t - hold - explode - exploded) / assemble;
  return 0;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** How far (0..1, eased) a part has travelled, given its window in the explode phase. */
export function partTravel(progress: number, [start, end]: readonly [number, number]): number {
  return easeInOutCubic(Math.min(1, Math.max(0, (progress - start) / (end - start))));
}

/** The dashed assembly guides fade in as the engine comes apart. */
export function guideOpacity(progress: number): number {
  return Math.min(1, Math.max(0, (progress - 0.08) / 0.45));
}
