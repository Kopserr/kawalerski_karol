import type { Database } from "@/lib/supabase/database.types";
import type {
  GameEvent,
  Minigame,
  Tile,
  TileState,
} from "@/lib/types";

type TileRow = Database["public"]["Tables"]["tiles"]["Row"];
type TileStateRow = Database["public"]["Tables"]["tile_states"]["Row"];
type MinigameRow = Database["public"]["Tables"]["minigames"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];

/** DB rows are snake_case; the UI layer speaks the camelCase domain types
 * from src/lib/types.ts (unchanged since Phase 1) — these are the only
 * place the two shapes meet. */

export function mapTile(row: TileRow): Tile {
  return {
    id: row.id,
    position: row.position,
    category: row.category,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty as 1 | 2 | 3,
    location: row.location ?? undefined,
    requiresProof: row.requires_proof,
    requiresApproval: row.requires_approval,
    voiceoverUrl: row.voiceover_url,
    videoUrl: row.video_url,
  };
}

export function mapTileState(
  row: TileStateRow,
  proof?: Pick<SubmissionRow, "media_url" | "media_type"> | null,
): TileState {
  return {
    tileId: row.tile_id,
    state: row.state,
    openedAt: row.opened_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    rejectReason: row.reject_reason ?? undefined,
    proofUrl: proof?.media_url,
    proofType: proof?.media_type,
  };
}

export function mapMinigame(row: MinigameRow): Minigame {
  return {
    key: row.key,
    slot: row.slot,
    title: row.title,
    unlockAt: row.unlock_at,
    beaten: row.beaten,
    bestScore: row.best_score,
    attempts: row.attempts,
    beatenAt: row.beaten_at ?? undefined,
    bestTimeMs: row.best_time_ms ?? undefined,
  };
}

export function mapEvent(row: EventRow): GameEvent {
  return {
    id: row.id,
    type: row.type,
    tileId: row.tile_id ?? undefined,
    payload: (row.payload as Record<string, unknown>) ?? undefined,
    createdAt: row.created_at,
  };
}
