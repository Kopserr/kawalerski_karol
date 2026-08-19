import { estimatePeopleEngaged } from "./peopleEstimates";
import type { GameEvent, Minigame, Tile, TileState } from "@/lib/types";

export interface WrappedStats {
  durationLabel: string;
  drinkRunnerAttempts: number;
  pokusaFarthestBeforeWin: number | null;
  peopleEngaged: number;
  longestTask: { title: string; label: string } | null;
  skipsUsed: number;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} godz ${minutes} min`;
}

export function computeWrappedStats(params: {
  tiles: Tile[];
  tileStates: Record<number, TileState>;
  minigames: Minigame[];
  events: GameEvent[];
  startedAt: string | null;
  finishedAt?: string | null;
  pokusaFarthestBeforeWin: number | null;
}): WrappedStats {
  const { tiles, tileStates, minigames, events, startedAt, pokusaFarthestBeforeWin } = params;

  const finishedAt =
    params.finishedAt ?? events.find((e) => e.type === "game_finished")?.createdAt ?? null;
  const durationMs =
    startedAt && finishedAt
      ? new Date(finishedAt).getTime() - new Date(startedAt).getTime()
      : null;

  const drinkRunner = minigames.find((m) => m.key === "drink-runner");

  const doneTileIds = tiles
    .filter((t) => tileStates[t.id]?.state === "done")
    .map((t) => t.id);

  let longestTask: WrappedStats["longestTask"] = null;
  let longestMs = -1;
  for (const tile of tiles) {
    const state = tileStates[tile.id];
    if (!state || state.state !== "done" || !state.openedAt || !state.completedAt) continue;
    const ms = new Date(state.completedAt).getTime() - new Date(state.openedAt).getTime();
    if (ms > longestMs) {
      longestMs = ms;
      longestTask = { title: tile.title, label: formatDuration(ms) };
    }
  }

  const skipsUsed = events.filter(
    (e) => e.type === "approved" && (e.payload as { via?: string } | undefined)?.via === "skip",
  ).length;

  return {
    durationLabel: durationMs != null ? formatDuration(durationMs) : "—",
    drinkRunnerAttempts: drinkRunner?.attempts ?? 0,
    pokusaFarthestBeforeWin,
    peopleEngaged: estimatePeopleEngaged(doneTileIds),
    longestTask,
    skipsUsed,
  };
}
