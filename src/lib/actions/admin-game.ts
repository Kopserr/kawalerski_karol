"use server";

import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { ok: true } | { ok: false; error: string };

/** PAUZA GRY (BRIEF §8.1) — blocks tile opening, shows the groom a "przerwa"
 * screen. Signalled through `events` (see the note in
 * supabase/migrations/0001_init.sql) so it reaches the groom's device via
 * the same Realtime channel /board already subscribes to, without ever
 * putting `game_state` (which carries access_code) on the wire for anon. */
export async function togglePauseAction(): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("game_state")
    .select("status")
    .eq("id", 1)
    .maybeSingle();

  const pausing = current?.status !== "paused";
  const nextStatus = pausing ? "paused" : "running";

  const { error } = await supabase.from("game_state").update({ status: nextStatus }).eq("id", 1);
  if (error) return { ok: false, error: error.message };

  await supabase.from("events").insert({ type: pausing ? "game_paused" : "game_resumed" });
  return { ok: true };
}

export type ResetMode = "soft" | "hard";

/**
 * /admin/danger (BRIEF §8.3). Clears tile_states/submissions/events/
 * minigame_attempts, zeroes minigames.beaten/best_score/attempts, resets
 * game_state's play fields. Never touches `tiles` content or the `faces`
 * bucket (groom/bride photos) — the brief is explicit that a restart must
 * not force re-uploading those. HARD additionally empties the `proofs`
 * bucket (actual photo/video bytes); SOFT leaves already-uploaded proof
 * files orphaned in storage but wipes every row that references them.
 */
export async function restartGameAction(mode: ResetMode, code: string): Promise<ActionResult> {
  const expected = process.env.ADMIN_RESET_CODE;
  if (!expected) {
    return { ok: false, error: "ADMIN_RESET_CODE nie jest ustawiony w środowisku." };
  }
  if (code.trim() !== expected.trim()) {
    return { ok: false, error: "Zły kod restartu." };
  }

  const supabase = createAdminClient();

  const { data: tiles, error: tilesError } = await supabase.from("tiles").select("id");
  if (tilesError) return { ok: false, error: tilesError.message };

  const results = await Promise.all([
    supabase.from("submissions").delete().gte("created_at", "1900-01-01"),
    supabase.from("events").delete().gte("created_at", "1900-01-01"),
    supabase.from("minigame_attempts").delete().gte("created_at", "1900-01-01"),
    supabase
      .from("tile_states")
      .upsert(
        (tiles ?? []).map((t) => ({
          tile_id: t.id,
          state: "locked",
          opened_at: null,
          completed_at: null,
          reject_reason: null,
        })),
      ),
    supabase
      .from("minigames")
      .update({ beaten: false, best_score: 0, attempts: 0, beaten_at: null, best_time_ms: null })
      .in("key", ["drink-runner", "pokusa"]),
    supabase
      .from("game_state")
      .update({
        status: "running",
        started_at: null,
        finished_at: null,
        skips_left: 2,
      })
      .eq("id", 1),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };

  if (mode === "hard") {
    const { data: files } = await supabase.storage.from("proofs").list("", { limit: 1000 });
    // proofs are stored under `${tileId}/...` — list() only sees top-level
    // entries, so recurse one level. `tile-media/${tileId}/...` (admin task
    // video uploads) is two levels deep and isn't swept here — rare enough
    // (an admin-only upload, not player-generated) to leave as a known gap
    // rather than write a full recursive storage walker for it.
    const paths: string[] = [];
    for (const entry of files ?? []) {
      if (!entry.id) {
        const { data: nested } = await supabase.storage.from("proofs").list(entry.name, { limit: 1000 });
        for (const n of nested ?? []) paths.push(`${entry.name}/${n.name}`);
      } else {
        paths.push(entry.name);
      }
    }
    if (paths.length > 0) await supabase.storage.from("proofs").remove(paths);
  }

  return { ok: true };
}
