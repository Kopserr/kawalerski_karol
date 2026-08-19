import type { Minigame } from "@/lib/types";

/** Two arenas, per BRIEF §7. Unlock thresholds are fixed game rules. */
export const MINIGAMES: Minigame[] = [
  {
    key: "drink-runner",
    slot: 1,
    title: "Drink Runner",
    unlockAt: 6,
    beaten: false,
    bestScore: 0,
    attempts: 0,
  },
  {
    key: "pokusa",
    slot: 2,
    title: "Pokusa",
    unlockAt: 12,
    beaten: false,
    bestScore: 0,
    attempts: 0,
  },
];

export function getMinigameByKey(key: string): Minigame | undefined {
  return MINIGAMES.find((m) => m.key === key);
}
