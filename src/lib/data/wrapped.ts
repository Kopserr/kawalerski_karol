import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapEvent } from "@/lib/supabase/mappers";
import type { GameEvent } from "@/lib/types";

export interface GalleryItem {
  tileId: number;
  tileTitle: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  createdAt: string;
}

export interface WrappedExtras {
  events: GameEvent[];
  gallery: GalleryItem[];
  /** Every recorded Pokusa attempt that did NOT win — used for "najdalszy
   * wynik w Pokusie przed wygraną" (BRIEF §5.5). null in local mode, where
   * individual attempts aren't persisted (only the aggregate is). */
  pokusaFarthestBeforeWin: number | null;
}

/**
 * Everything /wrapped needs beyond what getBoardData() already covers:
 * the *full* event history (not capped at 100) and per-attempt minigame
 * history. Anon-key only — same RLS boundary as lib/data/board.ts.
 */
export async function getWrappedExtras(): Promise<WrappedExtras | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const [eventsRes, submissionsRes, attemptsRes] = await Promise.all([
    supabase.from("events").select("*").order("created_at", { ascending: true }).limit(1000),
    supabase
      .from("submissions")
      .select("tile_id, media_url, media_type, created_at, tiles(title)")
      .eq("status", "approved")
      .order("created_at", { ascending: true }),
    supabase
      .from("minigame_attempts")
      .select("score, won")
      .eq("game_key", "pokusa"),
  ]);

  interface SubmissionRow {
    tile_id: number | null;
    media_url: string;
    media_type: "image" | "video";
    created_at: string;
    tiles: { title: string } | null;
  }
  const submissionRows = (submissionsRes.data ?? []) as unknown as SubmissionRow[];
  const gallery: GalleryItem[] = submissionRows
    .filter((s) => s.tile_id != null)
    .map((s) => ({
      tileId: s.tile_id as number,
      tileTitle: s.tiles?.title ?? `Zadanie ${s.tile_id}`,
      mediaUrl: s.media_url,
      mediaType: s.media_type,
      createdAt: s.created_at,
    }));

  const attempts = attemptsRes.data ?? [];
  const losses = attempts.filter((a) => !a.won);
  // null = never attempted; 0 = won on the very first try, no prior misses.
  const pokusaFarthestBeforeWin =
    attempts.length === 0 ? null : losses.length > 0 ? Math.max(...losses.map((a) => a.score)) : 0;

  return {
    events: (eventsRes.data ?? []).map(mapEvent),
    gallery,
    pokusaFarthestBeforeWin,
  };
}
