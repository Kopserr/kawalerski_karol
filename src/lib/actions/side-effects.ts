import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getCompletedLines } from "@/lib/bingo";

type AdminClient = SupabaseClient<Database>;

/**
 * Runs after any mutation that can change progress (tile approved/skipped,
 * minigame beaten): detects newly-completed BINGO lines, newly-unlocked
 * arenas and full-game completion, and logs the corresponding `events` rows
 * so /live and /wrapped see them too — not just the device that triggered
 * the change. Dedupes against events already recorded, so it's safe to call
 * after every mutation.
 */
export async function runCompletionSideEffects(supabase: AdminClient): Promise<void> {
  const [tilesRes, statesRes, minigamesRes, bingoEventsRes, unlockEventsRes, finishedEventRes] =
    await Promise.all([
      supabase.from("tiles").select("id, position"),
      supabase.from("tile_states").select("tile_id, state"),
      supabase.from("minigames").select("key, unlock_at, beaten"),
      supabase.from("events").select("payload").eq("type", "bingo"),
      supabase.from("events").select("payload").eq("type", "arena_unlocked"),
      supabase.from("events").select("id").eq("type", "game_finished").limit(1),
    ]);

  const tiles = tilesRes.data ?? [];
  const states = statesRes.data ?? [];
  const minigames = minigamesRes.data ?? [];

  const donePositions = new Set(
    tiles
      .filter((t) => states.find((s) => s.tile_id === t.id)?.state === "done")
      .map((t) => t.position),
  );
  const challengesDone = donePositions.size;
  const arenasBeaten = minigames.filter((m) => m.beaten).length;

  // BINGO lines
  const alreadyFiredLines = new Set(
    (bingoEventsRes.data ?? []).flatMap(
      (e) => ((e.payload as { lines?: string[] } | null)?.lines ?? []),
    ),
  );
  const newLines = getCompletedLines(donePositions).filter((l) => !alreadyFiredLines.has(l));
  if (newLines.length > 0) {
    await supabase.from("events").insert({ type: "bingo", payload: { lines: newLines } });
  }

  // Arena unlocks
  const alreadyUnlockedKeys = new Set(
    (unlockEventsRes.data ?? []).map((e) => (e.payload as { key?: string } | null)?.key),
  );
  for (const m of minigames) {
    if (!m.beaten && !alreadyUnlockedKeys.has(m.key) && challengesDone >= m.unlock_at) {
      await supabase
        .from("events")
        .insert({ type: "arena_unlocked", payload: { key: m.key } });
    }
  }

  // Full game completion
  const alreadyFinished = (finishedEventRes.data?.length ?? 0) > 0;
  if (!alreadyFinished && challengesDone === 16 && arenasBeaten === 2) {
    await supabase.from("events").insert({ type: "game_finished", payload: {} });
    await supabase
      .from("game_state")
      .update({ status: "finished", finished_at: new Date().toISOString() })
      .eq("id", 1);
  }
}
