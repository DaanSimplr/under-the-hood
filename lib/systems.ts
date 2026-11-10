/** Display helpers for car systems, shared by server and client components. */

/** CSS color for a system, from the design tokens. */
export function systemColor(systemId: string): string {
  return `var(--sys-${systemId})`;
}

export const DIFFICULTY_LABELS = ["", "Beginner", "Easy", "Moderate", "Hard", "Expert"] as const;

export function difficultyLabel(level: number): string {
  return DIFFICULTY_LABELS[level] ?? `Level ${level}`;
}
