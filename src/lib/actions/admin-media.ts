"use server";

import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Groom/bride face photos — used by both minigames (BRIEF §7.1, §7.2) and
 * stored on the single game_state row, not per-tile, even though the brief
 * places the uploader on /admin/tile/[id] (BRIEF §8.2) as the convenient
 * "one edit screen" rather than a dedicated settings page. */
export async function uploadFaceAction(formData: FormData): Promise<ActionResult> {
  const role = formData.get("role");
  const file = formData.get("file");
  if ((role !== "groom" && role !== "bride") || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Brak pliku." };
  }

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${role}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("faces")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: pub } = supabase.storage.from("faces").getPublicUrl(path);
  const patch = role === "groom" ? { groom_photo: pub.publicUrl } : { bride_photo: pub.publicUrl };
  const { error } = await supabase.from("game_state").update(patch).eq("id", 1);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateBrideNameAction(name: string): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("game_state")
    .update({ bride_name: name.trim() || null })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Optional video/audio for a single task's reveal (BRIEF §8.2, §9 —
 * "jeśli video_url istnieje, karta zadania odtwarza wideo zamiast
 * animacji reveal"). Reuses the public `proofs` bucket under a
 * `tile-media/` prefix rather than adding a third bucket for one field. */
export async function uploadTileVideoAction(
  tileId: number,
  formData: FormData,
): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Brak pliku." };

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `tile-media/${tileId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("proofs")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: pub } = supabase.storage.from("proofs").getPublicUrl(path);
  const { error } = await supabase.from("tiles").update({ video_url: pub.publicUrl }).eq("id", tileId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function clearTileVideoAction(tileId: number): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("tiles").update({ video_url: null }).eq("id", tileId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
