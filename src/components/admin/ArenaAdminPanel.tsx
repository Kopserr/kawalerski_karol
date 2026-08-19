"use client";

import { useState } from "react";
import { ChevronDown, Lock, Trophy, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { forceUnlockArenaAction, manualBeatArenaAction } from "@/lib/actions/admin-arena";
import { isArenaUnlocked } from "@/lib/progress";
import { haptics } from "@/lib/utils/haptics";
import type { Minigame, TileState } from "@/lib/types";

interface ArenaAdminPanelProps {
  minigames: Minigame[];
  tileStates: Record<number, TileState>;
  onChanged: (key: Minigame["key"], patch: Partial<Minigame>) => void;
}

export function ArenaAdminPanel({ minigames, tileStates, onChanged }: ArenaAdminPanelProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const challengesDone = Object.values(tileStates).filter((t) => t.state === "done").length;

  async function unlock(key: Minigame["key"]) {
    setBusy(key + "-unlock");
    const res = await forceUnlockArenaAction(key);
    if (res.ok) {
      haptics.success();
      onChanged(key, { unlockAt: 0 });
    }
    setBusy(null);
  }

  async function beat(key: Minigame["key"]) {
    setBusy(key + "-beat");
    const res = await manualBeatArenaAction(key);
    if (res.ok) {
      haptics.success();
      onChanged(key, { beaten: true, beatenAt: new Date().toISOString() });
    }
    setBusy(null);
  }

  return (
    <div className="glass rounded-2xl p-4">
      <h2 className="font-heading text-sm tracking-[0.2em] text-gold">ARENA</h2>
      <div className="mt-3 flex flex-col gap-2">
        {minigames.map((m) => {
          const unlocked = isArenaUnlocked(m, challengesDone);
          return (
            <div
              key={m.key}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"
            >
              <div>
                <p className="font-heading text-sm">{m.title}</p>
                <p className="text-xs text-fog">
                  {m.beaten ? (
                    <span className="text-mint">ukończona · wynik {m.bestScore}</span>
                  ) : unlocked ? (
                    <span className="text-cyan">odblokowana</span>
                  ) : (
                    <span>zablokowana · próg {m.unlockAt}</span>
                  )}{" "}
                  · {m.attempts} podejść
                </p>
              </div>
              {m.beaten ? (
                <Trophy className="size-5 text-gold" />
              ) : unlocked ? (
                <Unlock className="size-5 text-cyan" />
              ) : (
                <Lock className="size-5 text-fog" />
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-3 flex w-full items-center justify-between rounded-xl border border-blood/20 bg-blood/5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-blood"
      >
        Awaryjne
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-2">
          {minigames.map((m) => (
            <div key={m.key} className="grid grid-cols-2 gap-2">
              <button
                onClick={() => unlock(m.key)}
                disabled={busy !== null || isArenaUnlocked(m, challengesDone)}
                className="h-11 rounded-xl bg-blood/10 text-xs font-semibold text-blood disabled:opacity-30"
              >
                ODBLOKUJ TERAZ · {m.title}
              </button>
              <button
                onClick={() => beat(m.key)}
                disabled={busy !== null || m.beaten}
                className="h-11 rounded-xl bg-blood/10 text-xs font-semibold text-blood disabled:opacity-30"
              >
                ZALICZ RĘCZNIE · {m.title}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
