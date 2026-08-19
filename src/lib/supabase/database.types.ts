/**
 * Hand-written to match supabase/migrations/0001_init.sql. Regenerate with
 * `supabase gen types typescript` once a live project exists and keep this
 * file as the checked-in source of truth either way.
 *
 * `Relationships: []` and the empty `Functions` map are required by
 * @supabase/supabase-js's `GenericSchema`/`GenericTable` constraints —
 * without them every query resolves to `never` instead of the real row type.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      game_state: {
        Row: {
          id: number;
          status: "idle" | "running" | "paused" | "finished";
          started_at: string | null;
          finished_at: string | null;
          skips_left: number;
          groom_photo: string | null;
          bride_photo: string | null;
          bride_name: string | null;
          access_code: string;
        };
        Insert: Partial<Database["public"]["Tables"]["game_state"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["game_state"]["Row"]>;
        Relationships: [];
      };
      tiles: {
        Row: {
          id: number;
          position: number;
          category: "SPORT" | "LUDZIE" | "EKIPA" | "WSTYD" | "MALTA";
          title: string;
          description: string;
          difficulty: number;
          location: string | null;
          requires_proof: boolean;
          requires_approval: boolean;
          voiceover_url: string | null;
          video_url: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tiles"]["Row"]> & {
          id: number;
          position: number;
          category: Database["public"]["Tables"]["tiles"]["Row"]["category"];
          title: string;
          description: string;
        };
        Update: Partial<Database["public"]["Tables"]["tiles"]["Row"]>;
        Relationships: [];
      };
      tile_states: {
        Row: {
          tile_id: number;
          state: "locked" | "active" | "pending" | "done" | "rejected";
          opened_at: string | null;
          completed_at: string | null;
          reject_reason: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["tile_states"]["Row"]> & {
          tile_id: number;
        };
        Update: Partial<Database["public"]["Tables"]["tile_states"]["Row"]>;
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          tile_id: number | null;
          media_url: string;
          media_type: "image" | "video";
          created_at: string;
          status: "pending" | "approved" | "rejected";
          reviewed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["submissions"]["Row"]> & {
          media_url: string;
          media_type: "image" | "video";
        };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Row"]>;
        Relationships: [];
      };
      minigames: {
        Row: {
          key: "drink-runner" | "pokusa";
          slot: 1 | 2;
          title: string;
          unlock_at: number;
          beaten: boolean;
          best_score: number;
          attempts: number;
          beaten_at: string | null;
          best_time_ms: number | null;
        };
        Insert: Partial<Database["public"]["Tables"]["minigames"]["Row"]> & {
          key: "drink-runner" | "pokusa";
        };
        Update: Partial<Database["public"]["Tables"]["minigames"]["Row"]>;
        Relationships: [];
      };
      minigame_attempts: {
        Row: {
          id: string;
          game_key: "drink-runner" | "pokusa" | null;
          score: number;
          won: boolean;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["minigame_attempts"]["Row"]> & {
          score: number;
        };
        Update: Partial<Database["public"]["Tables"]["minigame_attempts"]["Row"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          type:
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
          tile_id: number | null;
          payload: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["events"]["Row"]> & {
          type: Database["public"]["Tables"]["events"]["Row"]["type"];
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      game_state_public: {
        Row: {
          id: number;
          status: "idle" | "running" | "paused" | "finished";
          started_at: string | null;
          finished_at: string | null;
          skips_left: number;
          groom_photo: string | null;
          bride_photo: string | null;
          bride_name: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
}
