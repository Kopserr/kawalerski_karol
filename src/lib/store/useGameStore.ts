"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TASKS } from "@/lib/seed/tasks";
import { MINIGAMES } from "@/lib/seed/minigames";
import { getCompletedLines } from "@/lib/bingo";
import { computeProgress } from "@/lib/progress";
import {
  approveSubmissionAction,
  openTileAction,
  rejectSubmissionAction,
  revertRejectedAction,
  skipTileAction,
  submitProofAction,
} from "@/lib/actions/tiles";
import { recordMinigameResultAction } from "@/lib/actions/minigames";
import { enqueueUpload } from "@/lib/offline/uploadQueue";
import type {
  EventType,
  GameEvent,
  GameStatus,
  Minigame,
  MinigameKey,
  Tile,
  TileState,
} from "@/lib/types";

/**
 * Client-side game cache. Two modes:
 *
 * - "supabase": hydrated from a Server Component's `getBoardData()` call,
 *   kept in sync by Realtime patches, mutated by calling the Server
 *   Actions in lib/actions/* (which run with service_role — never a
 *   direct client write, per BRIEF §10).
 * - "local": no Supabase project configured yet. Falls back to the exact
 *   Phase-1 in-memory behaviour so the app stays fully demoable while a
 *   project is being provisioned.
 *
 * Every screen reads through this store either way — they don't know
 * which mode they're in.
 */

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function initialTileStates(): Record<number, TileState> {
  const map: Record<number, TileState> = {};
  for (const t of TASKS) {
    map[t.id] = { tileId: t.id, state: "locked" };
  }
  return map;
}

export interface ServerHydration {
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

interface GameStore {
  backendMode: "supabase" | "local";
  groomAuthed: boolean;
  gameStatus: GameStatus;
  tiles: Tile[];
  tileStates: Record<number, TileState>;
  minigames: Minigame[];
  events: GameEvent[];
  skipsLeft: number;
  groomPhoto: string | null;
  bridePhoto: string | null;
  brideName: string | null;
  startedAt: string | null;
  bingoLinesFired: string[];
  pendingBingoLines: string[];
  arenaUnlockAlert: MinigameKey | null;
  arenaAlertsShown: MinigameKey[];

  hydrateFromServer: (data: ServerHydration) => void;
  setGroomAuthed: (v: boolean) => void;
  setGameStatus: (v: GameStatus) => void;

  openTile: (id: number) => Promise<void>;
  submitProof: (id: number, file: File) => Promise<{ ok: boolean; error?: string }>;
  skipTile: (id: number) => Promise<void>;
  devApprove: (id: number) => Promise<void>;
  devReject: (id: number, reason: string) => Promise<void>;

  recordMinigameResult: (
    key: MinigameKey,
    won: boolean,
    score: number,
    durationMs?: number,
  ) => Promise<void>;

  /** Applied by the Realtime subscription (Supabase mode only). */
  patchTileState: (tileId: number, patch: Partial<TileState>) => void;
  patchMinigame: (key: MinigameKey, patch: Partial<Minigame>) => void;
  pushEvent: (event: GameEvent) => void;

  acknowledgeArenaAlert: () => void;
  consumeBingoLines: () => void;

  resetSoft: () => void;
  logEvent: (type: EventType, tileId?: number, payload?: Record<string, unknown>) => void;

  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      backendMode: "local",
      groomAuthed: false,
      gameStatus: "running",
      tiles: TASKS,
      tileStates: initialTileStates(),
      minigames: MINIGAMES.map((m) => ({ ...m })),
      events: [],
      skipsLeft: 2,
      groomPhoto: null,
      bridePhoto: null,
      brideName: null,
      startedAt: null,
      bingoLinesFired: [],
      pendingBingoLines: [],
      arenaUnlockAlert: null,
      arenaAlertsShown: [],

      hydrateFromServer: (data) => {
        set({
          backendMode: "supabase",
          tiles: data.tiles.length > 0 ? data.tiles : TASKS,
          tileStates: Object.keys(data.tileStates).length > 0 ? data.tileStates : initialTileStates(),
          minigames: data.minigames.length > 0 ? data.minigames : MINIGAMES.map((m) => ({ ...m })),
          skipsLeft: data.skipsLeft,
          events: data.events,
          gameStatus: data.gameStatus,
          groomPhoto: data.groomPhoto,
          bridePhoto: data.bridePhoto,
          brideName: data.brideName,
          startedAt: data.startedAt,
        });
        checkCelebrations(set, get);
      },

      setGroomAuthed: (v) => set({ groomAuthed: v }),
      setGameStatus: (v) => set({ gameStatus: v }),

      logEvent: (type, tileId, payload) => {
        const event: GameEvent = { id: makeId(), type, tileId, payload, createdAt: nowIso() };
        set((s) => ({ events: [event, ...s.events].slice(0, 200) }));
      },

      openTile: async (id) => {
        const current = get().tileStates[id];
        if (!current || current.state !== "locked") return;

        set((s) => ({
          tileStates: { ...s.tileStates, [id]: { ...current, state: "active", openedAt: nowIso() } },
          startedAt: s.startedAt ?? nowIso(),
        }));
        get().logEvent("tile_opened", id);

        if (get().backendMode === "supabase") {
          await openTileAction(id);
        }
      },

      submitProof: async (id, file) => {
        const current = get().tileStates[id];
        if (!current) return { ok: false, error: "Nieznane zadanie." };
        const localPreviewUrl = URL.createObjectURL(file);
        const mediaType = file.type.startsWith("video") ? "video" : "image";

        if (get().backendMode === "local") {
          set((s) => ({
            tileStates: {
              ...s.tileStates,
              [id]: { ...current, state: "pending", proofUrl: localPreviewUrl, proofType: mediaType },
            },
          }));
          get().logEvent("proof_sent", id, { mediaType });
          return { ok: true };
        }

        // Optimistic local preview while the real upload runs.
        set((s) => ({
          tileStates: {
            ...s.tileStates,
            [id]: { ...current, state: "pending", proofUrl: localPreviewUrl, proofType: mediaType },
          },
        }));

        // Offline (or about to drop — roaming on Malta will): queue the
        // file in IndexedDB instead of failing outright (BRIEF §11).
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          await enqueueUpload(id, file);
          get().logEvent("proof_sent", id, { mediaType, queuedOffline: true });
          return { ok: true };
        }

        const formData = new FormData();
        formData.set("tileId", String(id));
        formData.set("file", file);
        try {
          const result = await submitProofAction(formData);
          if (!result.ok) {
            set((s) => ({ tileStates: { ...s.tileStates, [id]: current } }));
            return { ok: false, error: result.error };
          }
          set((s) => ({
            tileStates: {
              ...s.tileStates,
              [id]: { ...s.tileStates[id], proofUrl: result.mediaUrl, proofType: result.mediaType },
            },
          }));
          return { ok: true };
        } catch {
          // The request itself never reached the server — network drop
          // mid-flight. Queue it rather than losing the proof.
          await enqueueUpload(id, file);
          get().logEvent("proof_sent", id, { mediaType, queuedOffline: true });
          return { ok: true };
        }
      },

      skipTile: async (id) => {
        const { skipsLeft, backendMode } = get();
        if (skipsLeft <= 0) return;
        const current = get().tileStates[id];
        if (!current || current.state === "done") return;

        if (backendMode === "local") {
          set((s) => ({
            skipsLeft: s.skipsLeft - 1,
            tileStates: { ...s.tileStates, [id]: { ...current, state: "done", completedAt: nowIso() } },
          }));
          get().logEvent("approved", id, { via: "skip" });
          checkCelebrations(set, get);
          return;
        }

        const result = await skipTileAction(id);
        if (result.ok) {
          set((s) => ({
            skipsLeft: Math.max(0, s.skipsLeft - 1),
            tileStates: { ...s.tileStates, [id]: { ...current, state: "done", completedAt: nowIso() } },
          }));
          checkCelebrations(set, get);
        }
      },

      devApprove: async (id) => {
        const current = get().tileStates[id];
        if (!current) return;

        if (get().backendMode === "local") {
          set((s) => ({
            tileStates: { ...s.tileStates, [id]: { ...current, state: "done", completedAt: nowIso() } },
          }));
          get().logEvent("approved", id);
          checkCelebrations(set, get);
          return;
        }

        const result = await approveSubmissionAction(id);
        if (result.ok) {
          set((s) => ({
            tileStates: { ...s.tileStates, [id]: { ...current, state: "done", completedAt: nowIso() } },
          }));
          checkCelebrations(set, get);
        }
      },

      devReject: async (id, reason) => {
        const current = get().tileStates[id];
        if (!current) return;

        set((s) => ({
          tileStates: { ...s.tileStates, [id]: { ...current, state: "rejected", rejectReason: reason } },
        }));

        if (get().backendMode === "local") {
          get().logEvent("rejected", id, { reason });
        } else {
          await rejectSubmissionAction(id, reason);
        }

        setTimeout(async () => {
          const c = get().tileStates[id];
          if (c?.state !== "rejected") return;
          set((s) => ({ tileStates: { ...s.tileStates, [id]: { ...c, state: "active" } } }));
          if (get().backendMode === "supabase") await revertRejectedAction(id);
        }, 2000);
      },

      recordMinigameResult: async (key, won, score, durationMs) => {
        const apply = () =>
          set((s) => ({
            minigames: s.minigames.map((m) =>
              m.key === key
                ? {
                    ...m,
                    attempts: m.attempts + 1,
                    bestScore: Math.max(m.bestScore, score),
                    beaten: m.beaten || won,
                    beatenAt: won && !m.beaten ? nowIso() : m.beatenAt,
                    bestTimeMs:
                      won && durationMs ? Math.min(m.bestTimeMs ?? durationMs, durationMs) : m.bestTimeMs,
                  }
                : m,
            ),
          }));

        apply();
        checkCelebrations(set, get);

        if (get().backendMode === "local") {
          get().logEvent(won ? "minigame_won" : "minigame_failed", undefined, { key, score });
        } else {
          await recordMinigameResultAction(key, won, score, durationMs);
        }
      },

      patchTileState: (tileId, patch) => {
        set((s) => ({
          tileStates: { ...s.tileStates, [tileId]: { ...s.tileStates[tileId], tileId, ...patch } },
        }));
        checkCelebrations(set, get);
      },

      patchMinigame: (key, patch) => {
        set((s) => ({ minigames: s.minigames.map((m) => (m.key === key ? { ...m, ...patch } : m)) }));
        checkCelebrations(set, get);
      },

      pushEvent: (event) => {
        set((s) =>
          s.events.some((e) => e.id === event.id)
            ? s
            : { events: [event, ...s.events].slice(0, 200) },
        );
        // PAUZA GRY travels as an event, not a game_state Realtime row —
        // see the note in supabase/migrations/0001_init.sql.
        if (event.type === "game_paused") set({ gameStatus: "paused" });
        if (event.type === "game_resumed") set({ gameStatus: "running" });
      },

      acknowledgeArenaAlert: () => set({ arenaUnlockAlert: null }),
      consumeBingoLines: () => set({ pendingBingoLines: [] }),

      resetSoft: () => {
        set({
          tileStates: initialTileStates(),
          minigames: MINIGAMES.map((m) => ({ ...m })),
          events: [],
          skipsLeft: 2,
          bingoLinesFired: [],
          pendingBingoLines: [],
          arenaUnlockAlert: null,
          arenaAlertsShown: [],
          gameStatus: "running",
        });
      },

      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "lfd-game-state",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (s) => ({
        groomAuthed: s.groomAuthed,
        gameStatus: s.gameStatus,
        tiles: s.tiles,
        tileStates: s.tileStates,
        minigames: s.minigames,
        events: s.events,
        skipsLeft: s.skipsLeft,
        groomPhoto: s.groomPhoto,
        bridePhoto: s.bridePhoto,
        brideName: s.brideName,
        startedAt: s.startedAt,
        bingoLinesFired: s.bingoLinesFired,
        arenaAlertsShown: s.arenaAlertsShown,
      }),
    },
  ),
);

/** Fires the BINGO burst / arena-unlock alert exactly once per client
 * session when a transition is newly observed — regardless of whether the
 * change came from an optimistic update or a Realtime patch. */
function checkCelebrations(
  set: (partial: Partial<GameStore> | ((s: GameStore) => Partial<GameStore>)) => void,
  get: () => GameStore,
) {
  const { tiles, tileStates, bingoLinesFired, minigames } = get();
  const donePositions = new Set(
    tiles.filter((t) => tileStates[t.id]?.state === "done").map((t) => t.position),
  );
  const newLines = getCompletedLines(donePositions).filter((l) => !bingoLinesFired.includes(l));
  if (newLines.length > 0) {
    set((s) => ({
      bingoLinesFired: [...s.bingoLinesFired, ...newLines],
      pendingBingoLines: [...s.pendingBingoLines, ...newLines],
    }));
  }

  const progress = computeProgress(Object.values(get().tileStates), minigames);
  for (const m of minigames) {
    const alreadyShown = get().arenaAlertsShown.includes(m.key);
    if (!m.beaten && !alreadyShown && progress.challengesDone >= m.unlockAt) {
      set((s) => ({ arenaUnlockAlert: m.key, arenaAlertsShown: [...s.arenaAlertsShown, m.key] }));
    }
  }
}
