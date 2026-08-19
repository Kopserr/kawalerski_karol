"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArenaCard } from "@/components/board/ArenaCard";
import { useGameStore, type ServerHydration } from "@/lib/store/useGameStore";
import { useServerSync } from "@/lib/hooks/useServerSync";
import { computeProgress, isArenaUnlocked } from "@/lib/progress";

export function ArenaClient({ initial }: { initial: ServerHydration | null }) {
  useServerSync(initial);

  const tileStates = useGameStore((s) => s.tileStates);
  const minigames = useGameStore((s) => s.minigames);
  const progress = computeProgress(Object.values(tileStates), minigames);

  return (
    <main className="mx-auto flex h-dvh w-full max-w-[520px] flex-col bg-void safe-x safe-top safe-bottom">
      <header className="flex items-center gap-3 px-4 py-4">
        <Link
          href="/board"
          className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-heading text-lg tracking-[0.3em] text-gold">A R E N A</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <p className="mb-4 text-sm text-fog">
          Dwie bramy równoległe do planszy. Trzeba przejść obie, żeby
          odblokować WRAPPED — nieograniczona liczba podejść.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {minigames
            .slice()
            .sort((a, b) => a.slot - b.slot)
            .map((m) => (
              <ArenaCard
                key={m.key}
                minigame={m}
                challengesDone={progress.challengesDone}
                unlocked={isArenaUnlocked(m, progress.challengesDone)}
              />
            ))}
        </div>
      </div>
    </main>
  );
}
