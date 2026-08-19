"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapEvent, mapMinigame, mapTileState } from "@/lib/supabase/mappers";
import { useGameStore } from "@/lib/store/useGameStore";
import type { Database } from "@/lib/supabase/database.types";

type TileStateRow = Database["public"]["Tables"]["tile_states"]["Row"];
type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];
type MinigameRow = Database["public"]["Tables"]["minigames"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

/**
 * Subscribes /board and /live to tile_states, submissions, minigames and
 * events (BRIEF §10 "Realtime: włącz publikację na..."). A no-op when
 * Supabase isn't configured, so it's safe to mount unconditionally.
 */
export function useRealtimeGame() {
  const patchTileState = useGameStore((s) => s.patchTileState);
  const patchMinigame = useGameStore((s) => s.patchMinigame);
  const pushEvent = useGameStore((s) => s.pushEvent);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();

    const channel = supabase
      .channel("game-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tile_states" },
        (payload) => {
          const row = payload.new as TileStateRow;
          if (!row?.tile_id) return;
          patchTileState(row.tile_id, mapTileState(row));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        (payload) => {
          const row = payload.new as SubmissionRow;
          if (!row?.tile_id || row.status !== "approved") return;
          patchTileState(row.tile_id, { proofUrl: row.media_url, proofType: row.media_type });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "minigames" },
        (payload) => {
          const row = payload.new as MinigameRow;
          if (!row?.key) return;
          patchMinigame(row.key, mapMinigame(row));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload) => {
          pushEvent(mapEvent(payload.new as EventRow));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [patchTileState, patchMinigame, pushEvent]);
}
