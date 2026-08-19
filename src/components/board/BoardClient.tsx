"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import { BingoGrid } from "@/components/board/BingoGrid";
import { ProgressBar } from "@/components/board/ProgressBar";
import { ArenaStrip } from "@/components/board/ArenaStrip";
import { WrappedTeaser } from "@/components/board/WrappedTeaser";
import { BingoBurst } from "@/components/board/BingoBurst";
import { ArenaUnlockAlert } from "@/components/board/ArenaUnlockAlert";
import { PausedOverlay } from "@/components/board/PausedOverlay";
import { GlowCard } from "@/components/fx/GlowCard";
import { useGameStore } from "@/lib/store/useGameStore";
import { useAudioStore } from "@/lib/store/useAudioStore";
import { useServerSync } from "@/lib/hooks/useServerSync";
import { computeProgress } from "@/lib/progress";
import { haptics } from "@/lib/utils/haptics";
import type { ServerHydration } from "@/lib/store/useGameStore";

const GROOM_NAME = process.env.NEXT_PUBLIC_GROOM_NAME ?? "Panie Młody";

export function BoardClient({ initial }: { initial: ServerHydration | null }) {
  useServerSync(initial);

  const router = useRouter();
  const tiles = useGameStore((s) => s.tiles);
  const tileStates = useGameStore((s) => s.tileStates);
  const minigames = useGameStore((s) => s.minigames);
  const pendingBingoLines = useGameStore((s) => s.pendingBingoLines);
  const arenaUnlockAlert = useGameStore((s) => s.arenaUnlockAlert);
  const consumeBingoLines = useGameStore((s) => s.consumeBingoLines);
  const acknowledgeArenaAlert = useGameStore((s) => s.acknowledgeArenaAlert);
  const soundOn = useAudioStore((s) => s.soundOn);
  const toggleSound = useAudioStore((s) => s.toggle);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const paused = gameStatus === "paused";

  const progress = computeProgress(Object.values(tileStates), minigames);
  const byPosition = [...tiles].sort((a, b) => a.position - b.position);

  const nextTile =
    byPosition.find((t) => tileStates[t.id]?.state === "active") ??
    byPosition.find((t) => tileStates[t.id]?.state === "locked");

  function goToNext() {
    if (!nextTile || paused) return;
    haptics.tap();
    router.push(`/tile/${nextTile.id}`);
  }

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-[520px] flex-col bg-void">
      <header className="safe-top sticky top-0 z-20 glass flex items-center justify-between rounded-b-2xl px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-9 items-center justify-center rounded-full text-sm font-heading text-void"
            style={{ background: "var(--grad-cool)" }}
          >
            {GROOM_NAME.charAt(0).toUpperCase()}
          </div>
          <span className="font-heading text-sm tracking-wide">LAST FREE DAY</span>
        </div>
        <button
          onClick={toggleSound}
          aria-label={soundOn ? "Wyłącz dźwięk" : "Włącz dźwięk"}
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 safe-x">
        <GlowCard className="p-4">
          <ProgressBar
            challengesDone={progress.challengesDone}
            arenasBeaten={progress.arenasBeaten}
          />
        </GlowCard>

        <div className="mt-4">
          <BingoGrid tiles={tiles} tileStates={tileStates} interactive={!paused} />
        </div>

        <ArenaStrip minigames={minigames} challengesDone={progress.challengesDone} />

        <WrappedTeaser total={progress.total} isComplete={progress.isComplete} />
      </div>

      <div className="safe-bottom safe-x sticky bottom-0 z-20 px-4 pb-3 pt-2">
        <button
          onClick={goToNext}
          disabled={!nextTile || paused}
          className="glow-cyan flex h-14 w-full items-center justify-center rounded-2xl font-heading text-base tracking-wide text-void disabled:opacity-40"
          style={{ background: "var(--grad-cool)" }}
        >
          {nextTile
            ? `NASTĘPNE ZADANIE · ${String(nextTile.id).padStart(2, "0")}`
            : "WSZYSTKIE ZADANIA OTWARTE"}
        </button>
      </div>

      <AnimatePresence>{paused && <PausedOverlay />}</AnimatePresence>
      <AnimatePresence>
        {pendingBingoLines.length > 0 && <BingoBurst onDone={consumeBingoLines} />}
      </AnimatePresence>
      <AnimatePresence>
        {arenaUnlockAlert && (
          <ArenaUnlockAlert arenaKey={arenaUnlockAlert} onDone={acknowledgeArenaAlert} />
        )}
      </AnimatePresence>
    </main>
  );
}
