/** Shared domain types — mirrors the Supabase schema from BRIEF §10 so the
 * phase-1 in-memory store can be swapped for real queries without reshaping
 * the UI layer. */

export type Category = "SPORT" | "LUDZIE" | "EKIPA" | "WSTYD" | "MALTA";

export type TileStateValue =
  | "locked"
  | "active"
  | "pending"
  | "done"
  | "rejected";

export interface Tile {
  id: number; // 1..16
  position: number; // 0..15 on the board, fixed — never randomized at runtime
  category: Category;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3;
  location?: string;
  requiresProof: boolean;
  requiresApproval: boolean;
  voiceoverUrl?: string | null;
  videoUrl?: string | null;
}

export interface TileState {
  tileId: number;
  state: TileStateValue;
  openedAt?: string;
  completedAt?: string;
  rejectReason?: string;
  proofUrl?: string;
  proofType?: "image" | "video";
}

export type MinigameKey = "drink-runner" | "pokusa";

export interface Minigame {
  key: MinigameKey;
  slot: 1 | 2;
  title: string;
  unlockAt: number; // challenges done required to unlock (6 / 12)
  beaten: boolean;
  bestScore: number;
  attempts: number;
  beatenAt?: string;
  bestTimeMs?: number;
}

export type EventType =
  | "tile_opened"
  | "proof_sent"
  | "approved"
  | "rejected"
  | "bingo"
  | "arena_unlocked"
  | "minigame_failed"
  | "minigame_won"
  | "game_finished"
  | "game_paused"
  | "game_resumed";

export interface GameEvent {
  id: string;
  type: EventType;
  tileId?: number;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export type GameStatus = "idle" | "running" | "paused" | "finished";
