import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapEvent, mapMinigame, mapTile, mapTileState } from "@/lib/supabase/mappers";
import type { GameEvent, GameStatus, Minigame, Tile, TileState } from "@/lib/types";

export interface BoardData {
  tiles: Tile[];
  tileStates: Record<number, TileState>;
  minigames: Minigame[];
  skipsLeft: number;
  events: GameEvent[];
  gameStatus: GameStatus;
  groomPhoto: string | null;
  bridePhoto: string | null;
  brideName: string | null;
  startedAt: string | null;
}

/**
 * One round-trip for everything /board, /live and /tile/[id] need to
 * render. Runs with the anon key — respects the exact RLS shape from
 * supabase/migrations/0001_init.sql, so this function can never leak
 * `game_state.access_code`.
 */
export async function getBoardData(): Promise<BoardData | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const [tilesRes, statesRes, minigamesRes, submissionsRes, gameStateRes, eventsRes] =
    await Promise.all([
      supabase.from("tiles").select("*").order("position", { ascending: true }),
      supabase.from("tile_states").select("*"),
      supabase.from("minigames").select("*"),
      supabase
        .from("submissions")
        .select("tile_id, media_url, media_type, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      supabase.from("game_state_public").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  if (tilesRes.error) throw tilesRes.error;
  if (statesRes.error) throw statesRes.error;
  if (minigamesRes.error) throw minigamesRes.error;

  const latestProofByTile = new Map<
    number,
    { media_url: string; media_type: "image" | "video" }
  >();
  for (const s of submissionsRes.data ?? []) {
    if (s.tile_id == null || latestProofByTile.has(s.tile_id)) continue;
    latestProofByTile.set(s.tile_id, { media_url: s.media_url, media_type: s.media_type });
  }

  const tileStates: Record<number, TileState> = {};
  for (const row of statesRes.data ?? []) {
    tileStates[row.tile_id] = mapTileState(row, latestProofByTile.get(row.tile_id));
  }

  return {
    tiles: (tilesRes.data ?? []).map(mapTile),
    tileStates,
    minigames: (minigamesRes.data ?? []).map(mapMinigame),
    skipsLeft: gameStateRes.data?.skips_left ?? 2,
    events: (eventsRes.data ?? []).map(mapEvent),
    gameStatus: gameStateRes.data?.status ?? "running",
    groomPhoto: gameStateRes.data?.groom_photo ?? null,
    bridePhoto: gameStateRes.data?.bride_photo ?? null,
    brideName: gameStateRes.data?.bride_name ?? null,
    startedAt: gameStateRes.data?.started_at ?? null,
  };
}
