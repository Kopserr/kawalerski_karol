"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BingoGrid } from "@/components/board/BingoGrid";
import { ProgressBar } from "@/components/board/ProgressBar";
import { GlowCard } from "@/components/fx/GlowCard";
import { GradientMesh } from "@/components/fx/GradientMesh";
import { CATEGORY_LABEL } from "@/lib/categories";
import { useGameStore } from "@/lib/store/useGameStore";
import { useServerSync } from "@/lib/hooks/useServerSync";
import { computeProgress, TOTAL_STEPS } from "@/lib/progress";
import { cn } from "@/lib/utils";
import type { ServerHydration } from "@/lib/store/useGameStore";

const EVENT_LABEL: Record<string, string> = {
  tile_opened: "otworzył",
  proof_sent: "wysłał dowód:",
  approved: "zaliczył:",
  rejected: "odrzucone:",
  bingo: "BINGO!",
  arena_unlocked: "odblokował arenę",
  minigame_won: "przeszedł arenę",
  minigame_failed: "próbował arenę",
  game_finished: "SKOŃCZYŁ GRĘ",
  game_paused: "PAUZA",
  game_resumed: "WZNOWIONO",
};

const STAGE_LABEL: Record<string, { label: string; color: string }> = {
  idle: { label: "ZARAZ SIĘ ZACZNIE", color: "text-fog" },
  running: { label: "TRWA GRA", color: "text-mint" },
  paused: { label: "PRZERWA", color: "text-gold" },
  finished: { label: "ZAKOŃCZONE", color: "text-gold" },
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

/** Public, no-login spectator view (BRIEF §5.4) — pure Realtime subscriber. */
export function LiveClient({ initial }: { initial: ServerHydration | null }) {
  useServerSync(initial);

  const tiles = useGameStore((s) => s.tiles);
  const tileStates = useGameStore((s) => s.tileStates);
  const minigames = useGameStore((s) => s.minigames);
  const events = useGameStore((s) => s.events);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const progress = computeProgress(Object.values(tileStates), minigames);
  const stage = STAGE_LABEL[gameStatus] ?? STAGE_LABEL.running;

  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [events.length]);

  return (
    <main className="relative min-h-dvh w-full bg-void px-4 pb-10 pt-6 safe-x safe-top safe-bottom">
      <GradientMesh />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row">
        <div className="flex-1">
          <div className="mb-4 text-center sm:text-left">
            <h1 className="font-heading text-3xl text-glow-cyan">LAST FREE DAY</h1>
            <p className="text-sm text-fog">Na żywo z Malty · widok dla ekipy</p>
          </div>

          <GlowCard className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em]",
                  stage.color,
                )}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {stage.label}
              </span>
              <span className="font-heading text-3xl text-off-white">
                {progress.total}
                <span className="text-fog"> / {TOTAL_STEPS}</span>
              </span>
            </div>
            <ProgressBar
              challengesDone={progress.challengesDone}
              arenasBeaten={progress.arenasBeaten}
            />
          </GlowCard>

          <div className="mt-4">
            <BingoGrid tiles={tiles} tileStates={tileStates} interactive={false} />
          </div>
        </div>

        <div className="w-full sm:w-80">
          <h2 className="mb-2 font-heading text-sm tracking-[0.2em] text-fog">NA ŻYWO</h2>
          <div ref={feedRef} className="flex max-h-[70dvh] flex-col gap-2 overflow-y-auto sm:max-h-[80dvh]">
            {events.length === 0 && (
              <GlowCard className="p-4 text-sm text-fog">
                Jeszcze nic się nie wydarzyło. Czekamy na pierwszy ruch.
              </GlowCard>
            )}
            <AnimatePresence initial={false}>
              {events.map((e) => {
                const tile = e.tileId ? tiles.find((t) => t.id === e.tileId) : undefined;
                const proof = e.tileId ? tileStates[e.tileId]?.proofUrl : undefined;
                return (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <GlowCard className="flex items-center gap-3 p-3 text-sm">
                      {proof && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={proof}
                          alt=""
                          className="size-11 shrink-0 rounded-xl object-cover"
                          loading="lazy"
                        />
                      )}
                      <p className="min-w-0">
                        <span className="text-xs text-fog">{formatTime(e.createdAt)} · </span>
                        <span className="text-off-white">{EVENT_LABEL[e.type] ?? e.type}</span>{" "}
                        {tile && (
                          <span className="font-semibold text-cyan">
                            {tile.title}
                            <span className="ml-1 text-[10px] text-fog">
                              ({CATEGORY_LABEL[tile.category]})
                            </span>
                          </span>
                        )}
                      </p>
                    </GlowCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
