"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { runCompletionSideEffects } from "@/lib/actions/side-effects";
import type { MinigameKey } from "@/lib/types";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Records one attempt at an arena — win or lose, unlimited tries (BRIEF §7). */
export async function recordMinigameResultAction(
  key: MinigameKey,
  won: boolean,
  score: number,
  durationMs?: number,
): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("minigames")
    .select("*")
    .eq("key", key)
    .maybeSingle();
  if (!current) return { ok: false, error: "Nieznana arena." };

  const nowBeaten = current.beaten || won;
  const { error } = await supabase
    .from("minigames")
    .update({
      attempts: current.attempts + 1,
      best_score: Math.max(current.best_score, score),
      beaten: nowBeaten,
      beaten_at: won && !current.beaten ? new Date().toISOString() : current.beaten_at,
      best_time_ms:
        won && durationMs
          ? Math.min(current.best_time_ms ?? durationMs, durationMs)
          : current.best_time_ms,
    })
    .eq("key", key);
  if (error) return { ok: false, error: error.message };

  await supabase.from("minigame_attempts").insert({
    game_key: key,
    score,
    won,
    duration_ms: durationMs,
  });
  await supabase.from("events").insert({
    type: won ? "minigame_won" : "minigame_failed",
    payload: { key, score },
  });

  if (won) await runCompletionSideEffects(supabase);
  // No revalidatePath() here either — see the note in lib/actions/tiles.ts.
  return { ok: true };
}
