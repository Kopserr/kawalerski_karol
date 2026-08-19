import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapEvent, mapMinigame, mapTile, mapTileState } from "@/lib/supabase/mappers";
import type { GameEvent, Minigame, Tile, TileState } from "@/lib/types";

export interface PendingSubmission {
  id: string;
  tileId: number;
  tileTitle: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  createdAt: string;
}

export interface AdminDashboardData {
  tiles: Tile[];
  tileStates: Record<number, TileState>;
  minigames: Minigame[];
  events: GameEvent[];
  pending: PendingSubmission[];
  skipsLeft: number;
  gameStatus: "idle" | "running" | "paused" | "finished";
  groomPhoto: string | null;
  bridePhoto: string | null;
  brideName: string | null;
}

/**
 * Reads with service_role — the route is already behind Supabase Auth
 * (src/middleware.ts), so there's no extra RLS to satisfy here, unlike the
 * anon-only lib/data/board.ts.
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createAdminClient();

  const [tilesRes, statesRes, minigamesRes, eventsRes, pendingRes, gameStateRes] =
    await Promise.all([
      supabase.from("tiles").select("*").order("position", { ascending: true }),
      supabase.from("tile_states").select("*"),
      supabase.from("minigames").select("*"),
      supabase.from("events").select("*").order("created_at", { ascending: false }).limit(200),
      supabase
        .from("submissions")
        .select("id, tile_id, media_url, media_type, created_at, tiles(title)")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase.from("game_state").select("*").eq("id", 1).maybeSingle(),
    ]);

  if (tilesRes.error) throw tilesRes.error;
  if (statesRes.error) throw statesRes.error;
  if (minigamesRes.error) throw minigamesRes.error;
  if (pendingRes.error) throw pendingRes.error;

  const tileStates: Record<number, TileState> = {};
  for (const row of statesRes.data ?? []) {
    tileStates[row.tile_id] = mapTileState(row);
  }

  interface PendingRow {
    id: string;
    tile_id: number | null;
    media_url: string;
    media_type: "image" | "video";
    created_at: string;
    tiles: { title: string } | null;
  }
  const pendingRows = (pendingRes.data ?? []) as unknown as PendingRow[];

  const pending: PendingSubmission[] = pendingRows.map((s) => {
    return {
      id: s.id,
      tileId: s.tile_id ?? 0,
      tileTitle: s.tiles?.title ?? `Zadanie ${s.tile_id}`,
      mediaUrl: s.media_url,
      mediaType: s.media_type,
      createdAt: s.created_at,
    };
  });

  return {
    tiles: (tilesRes.data ?? []).map(mapTile),
    tileStates,
    minigames: (minigamesRes.data ?? []).map(mapMinigame),
    events: (eventsRes.data ?? []).map(mapEvent),
    pending,
    skipsLeft: gameStateRes.data?.skips_left ?? 2,
    gameStatus: gameStateRes.data?.status ?? "running",
    groomPhoto: gameStateRes.data?.groom_photo ?? null,
    bridePhoto: gameStateRes.data?.bride_photo ?? null,
    brideName: gameStateRes.data?.bride_name ?? null,
  };
}
