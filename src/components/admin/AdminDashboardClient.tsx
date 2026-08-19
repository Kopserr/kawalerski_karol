"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SubmissionQueue } from "@/components/admin/SubmissionQueue";
import { TileGridAdmin } from "@/components/admin/TileGridAdmin";
import { ArenaAdminPanel } from "@/components/admin/ArenaAdminPanel";
import { EventLog } from "@/components/admin/EventLog";
import { PauseToggle } from "@/components/admin/PauseToggle";
import { useAdminRealtime } from "@/lib/hooks/useAdminRealtime";
import type { AdminDashboardData, PendingSubmission } from "@/lib/data/admin";
import type { Minigame, TileState } from "@/lib/types";

export function AdminDashboardClient({ initial }: { initial: AdminDashboardData }) {
  const [pending, setPending] = useState<PendingSubmission[]>(initial.pending);
  const [tileStates, setTileStates] = useState<Record<number, TileState>>(initial.tileStates);
  const [minigames, setMinigames] = useState<Minigame[]>(initial.minigames);
  const [paused, setPaused] = useState(initial.gameStatus === "paused");
  const [newSinceView, setNewSinceView] = useState(0);

  useAdminRealtime((row) => {
    const tile = initial.tiles.find((t) => t.id === row.tile_id);
    setPending((prev) => {
      if (prev.some((p) => p.id === row.id)) return prev;
      return [
        ...prev,
        {
          id: row.id,
          tileId: row.tile_id ?? 0,
          tileTitle: tile?.title ?? `Zadanie ${row.tile_id}`,
          mediaUrl: row.media_url,
          mediaType: row.media_type,
          createdAt: row.created_at,
        },
      ];
    });
    setNewSinceView((n) => n + 1);
  });

  function resolveSubmission(id: string) {
    const submission = pending.find((p) => p.id === id);
    setPending((prev) => prev.filter((p) => p.id !== id));
    if (submission) {
      setTileStates((prev) => ({
        ...prev,
        [submission.tileId]: { ...prev[submission.tileId], tileId: submission.tileId, state: "done" },
      }));
    }
  }

  function patchTileState(tileId: number, patch: Partial<TileState>) {
    setTileStates((prev) => ({ ...prev, [tileId]: { ...prev[tileId], tileId, ...patch } }));
  }

  function patchMinigame(key: Minigame["key"], patch: Partial<Minigame>) {
    setMinigames((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col bg-void safe-x safe-bottom">
      <AdminHeader title="Dashboard" />

      <div className="flex flex-col gap-5 px-4 py-4">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-heading text-sm tracking-[0.2em] text-fog">
              KOLEJKA DOWODÓW
            </h2>
            {newSinceView > 0 && (
              <span
                onClick={() => setNewSinceView(0)}
                className="flex items-center gap-1 rounded-full bg-magenta/20 px-2 py-1 text-xs font-semibold text-magenta"
              >
                <Bell className="size-3" /> {newSinceView} nowe
              </span>
            )}
          </div>
          <SubmissionQueue pending={pending} onResolved={resolveSubmission} />
        </section>

        <PauseToggle paused={paused} onToggled={setPaused} />

        <section>
          <h2 className="mb-2 font-heading text-sm tracking-[0.2em] text-fog">
            16 KAFELKÓW
          </h2>
          <div className="glass rounded-2xl p-3">
            <TileGridAdmin tiles={initial.tiles} tileStates={tileStates} onChanged={patchTileState} />
          </div>
        </section>

        <ArenaAdminPanel minigames={minigames} tileStates={tileStates} onChanged={patchMinigame} />

        <EventLog events={initial.events} tiles={initial.tiles} />
      </div>
    </main>
  );
}
