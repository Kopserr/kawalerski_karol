"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { runCompletionSideEffects } from "@/lib/actions/side-effects";
import type { Category, TileStateValue } from "@/lib/types";

type ActionResult = { ok: true } | { ok: false; error: string };

export interface TileContentPatch {
  title: string;
  description: string;
  category: Category;
  difficulty: 1 | 2 | 3;
  location: string | null;
  requiresProof: boolean;
  requiresApproval: boolean;
}

/** /admin/tile/[id] save — instant, no draft state (BRIEF §8.2). */
export async function updateTileContentAction(
  tileId: number,
  patch: TileContentPatch,
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tiles")
    .update({
      title: patch.title,
      description: patch.description,
      category: patch.category,
      difficulty: patch.difficulty,
      location: patch.location,
      requires_proof: patch.requiresProof,
      requires_approval: patch.requiresApproval,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tileId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** "ZALICZ RĘCZNIE" — the phone died, the game crashed, whatever. Counts
 * the same as an admin approval (BRIEF §8.1). */
export async function manualCompleteTileAction(tileId: number): Promise<ActionResult> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("tile_states")
    .update({ state: "done", completed_at: now })
    .eq("tile_id", tileId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("events").insert({ type: "approved", tile_id: tileId, payload: { via: "manual" } });
  await runCompletionSideEffects(supabase);
  return { ok: true };
}

/** "COFNIJ" — clean revert back to LOCKED, whatever state it was in. */
export async function manualRevertTileAction(tileId: number): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tile_states")
    .update({
      state: "locked",
      opened_at: null,
      completed_at: null,
      reject_reason: null,
    })
    .eq("tile_id", tileId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Escape hatch for setting an arbitrary state directly, used by the
 * dashboard's per-tile state pill. */
export async function manualSetTileStateAction(
  tileId: number,
  state: TileStateValue,
): Promise<ActionResult> {
  if (state === "done") return manualCompleteTileAction(tileId);
  if (state === "locked") return manualRevertTileAction(tileId);

  const supabase = createAdminClient();
  const { error } = await supabase.from("tile_states").update({ state }).eq("tile_id", tileId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
