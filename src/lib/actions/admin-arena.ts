"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { runCompletionSideEffects } from "@/lib/actions/side-effects";
import type { MinigameKey } from "@/lib/types";

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Emergency-only controls (BRIEF §8.1, kept under a collapsed "awaryjne"
 * section in the UI so they can't be tapped by accident).
 */

/** unlock_at is the only thing that gates an arena (BRIEF §10's
 * `arenaUnlocked` formula) — dropping it to 0 makes `isArenaUnlocked`
 * return true immediately without inventing a second "force unlocked"
 * flag anywhere else in the data model. */
export async function forceUnlockArenaAction(key: MinigameKey): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("minigames").update({ unlock_at: 0 }).eq("key", key);
  if (error) return { ok: false, error: error.message };
  await supabase.from("events").insert({ type: "arena_unlocked", payload: { key, via: "manual" } });
  return { ok: true };
}

export async function manualBeatArenaAction(key: MinigameKey): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("minigames")
    .select("beaten")
    .eq("key", key)
    .maybeSingle();
  if (current?.beaten) return { ok: true };

  const { error } = await supabase
    .from("minigames")
    .update({ beaten: true, beaten_at: new Date().toISOString() })
    .eq("key", key);
  if (error) return { ok: false, error: error.message };

  await supabase.from("events").insert({ type: "minigame_won", payload: { key, via: "manual" } });
  await runCompletionSideEffects(supabase);
  return { ok: true };
}
