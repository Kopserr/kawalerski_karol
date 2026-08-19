"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { runCompletionSideEffects } from "@/lib/actions/side-effects";

// Deliberately no `revalidatePath()` calls in this file: /board can be open
// as the *intercepted* @modal route (BRIEF §3), and invalidating its Server
// Component cache from an action fired while that modal is mounted makes
// Next drop the interception and pop back to the plain /board route. The
// client store (optimistic update here + Realtime patch) is already the
// live source of truth, so there's nothing revalidation would add.

type ActionResult<T = Record<never, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** LOCKED → ACTIVE. Idempotent — re-opening an already-active tile is a no-op. */
export async function openTileAction(tileId: number): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("tile_states")
    .select("state")
    .eq("tile_id", tileId)
    .maybeSingle();
  if (!current || current.state !== "locked") return { ok: true };

  const { error } = await supabase
    .from("tile_states")
    .update({ state: "active", opened_at: new Date().toISOString() })
    .eq("tile_id", tileId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("events").insert({ type: "tile_opened", tile_id: tileId });

  // First tile ever opened = the game actually started — feeds WRAPPED's
  // "czas trwania gry" (BRIEF §5.5). Only set once.
  const { data: gameState } = await supabase
    .from("game_state")
    .select("started_at")
    .eq("id", 1)
    .maybeSingle();
  if (gameState && !gameState.started_at) {
    await supabase.from("game_state").update({ started_at: new Date().toISOString() }).eq("id", 1);
  }

  return { ok: true };
}

/** Uploads the proof to Storage, files the submission, ACTIVE → PENDING. */
export async function submitProofAction(
  formData: FormData,
): Promise<ActionResult<{ mediaUrl: string; mediaType: "image" | "video" }>> {
  const tileId = Number(formData.get("tileId"));
  const file = formData.get("file");
  if (!tileId || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Brak pliku dowodu." };
  }

  const supabase = createAdminClient();
  const mediaType: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
  const ext = file.name.split(".").pop()?.toLowerCase() || (mediaType === "video" ? "mp4" : "jpg");
  const path = `${tileId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("proofs")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: pub } = supabase.storage.from("proofs").getPublicUrl(path);
  const mediaUrl = pub.publicUrl;

  const { error: insertError } = await supabase.from("submissions").insert({
    tile_id: tileId,
    media_url: mediaUrl,
    media_type: mediaType,
    status: "pending",
  });
  if (insertError) return { ok: false, error: insertError.message };

  const { error: stateError } = await supabase
    .from("tile_states")
    .update({ state: "pending" })
    .eq("tile_id", tileId);
  if (stateError) return { ok: false, error: stateError.message };

  await supabase.from("events").insert({ type: "proof_sent", tile_id: tileId, payload: { mediaType } });
  return { ok: true, mediaUrl, mediaType };
}

/** Consumes one of the two whole-game skips — instant DONE, no proof, no review. */
export async function skipTileAction(tileId: number): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: gameState } = await supabase
    .from("game_state")
    .select("skips_left")
    .eq("id", 1)
    .maybeSingle();
  if (!gameState || gameState.skips_left <= 0) {
    return { ok: false, error: "Nie zostały już żadne pominięcia." };
  }

  const { data: current } = await supabase
    .from("tile_states")
    .select("state")
    .eq("tile_id", tileId)
    .maybeSingle();
  if (current?.state === "done") return { ok: true };

  const now = new Date().toISOString();
  const { error: stateError } = await supabase
    .from("tile_states")
    .update({ state: "done", completed_at: now })
    .eq("tile_id", tileId);
  if (stateError) return { ok: false, error: stateError.message };

  const { error: skipError } = await supabase
    .from("game_state")
    .update({ skips_left: gameState.skips_left - 1 })
    .eq("id", 1);
  if (skipError) return { ok: false, error: skipError.message };

  await supabase.from("events").insert({ type: "approved", tile_id: tileId, payload: { via: "skip" } });
  await runCompletionSideEffects(supabase);
  return { ok: true };
}

/**
 * Approve / reject a pending submission. This is the real /admin/dashboard
 * action from BRIEF §8.1 — exposed early (behind a clearly-labelled "dev"
 * affordance in TaskCard) so the full pipeline is real end-to-end before
 * the admin UI itself lands in Phase 3.
 */
export async function approveSubmissionAction(tileId: number): Promise<ActionResult> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: pending } = await supabase
    .from("submissions")
    .select("id")
    .eq("tile_id", tileId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pending) {
    await supabase.from("submissions").update({ status: "approved", reviewed_at: now }).eq("id", pending.id);
  }

  const { error } = await supabase
    .from("tile_states")
    .update({ state: "done", completed_at: now })
    .eq("tile_id", tileId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("events").insert({ type: "approved", tile_id: tileId });
  await runCompletionSideEffects(supabase);
  return { ok: true };
}

export async function rejectSubmissionAction(
  tileId: number,
  reason: string,
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: pending } = await supabase
    .from("submissions")
    .select("id")
    .eq("tile_id", tileId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pending) {
    await supabase.from("submissions").update({ status: "rejected", reviewed_at: now }).eq("id", pending.id);
  }

  const { error } = await supabase
    .from("tile_states")
    .update({ state: "rejected", reject_reason: reason })
    .eq("tile_id", tileId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("events").insert({ type: "rejected", tile_id: tileId, payload: { reason } });
  return { ok: true };
}

/** REJECTED → ACTIVE, 2s after rejection (BRIEF §5.2). Server Actions can't
 * schedule themselves, so the client calls this once its local timer fires. */
export async function revertRejectedAction(tileId: number): Promise<void> {
  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("tile_states")
    .select("state")
    .eq("tile_id", tileId)
    .maybeSingle();
  if (current?.state !== "rejected") return;

  await supabase
    .from("tile_states")
    .update({ state: "active", reject_reason: null })
    .eq("tile_id", tileId);
}
