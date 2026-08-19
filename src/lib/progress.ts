import type { Minigame, TileState } from "@/lib/types";

/**
 * Single source of truth for the 18-step completion rule (BRIEF §10).
 * Never re-derive this logic in components — import from here.
 */

export const TOTAL_CHALLENGES = 16;
export const TOTAL_ARENAS = 2;
export const TOTAL_STEPS = TOTAL_CHALLENGES + TOTAL_ARENAS;

export function countChallengesDone(tileStates: TileState[]): number {
  return tileStates.filter((t) => t.state === "done").length;
}

export function countArenasBeaten(minigames: Minigame[]): number {
  return minigames.filter((m) => m.beaten).length;
}

export interface Progress {
  challengesDone: number;
  arenasBeaten: number;
  total: number;
  isComplete: boolean;
}

export function computeProgress(
  tileStates: TileState[],
  minigames: Minigame[],
): Progress {
  const challengesDone = countChallengesDone(tileStates);
  const arenasBeaten = countArenasBeaten(minigames);
  return {
    challengesDone,
    arenasBeaten,
    total: challengesDone + arenasBeaten,
    isComplete: challengesDone === TOTAL_CHALLENGES && arenasBeaten === TOTAL_ARENAS,
  };
}

export function isArenaUnlocked(
  minigame: Minigame,
  challengesDone: number,
): boolean {
  return challengesDone >= minigame.unlockAt;
}
