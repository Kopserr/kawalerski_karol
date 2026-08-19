import { ArenaCard } from "@/components/board/ArenaCard";
import { isArenaUnlocked } from "@/lib/progress";
import type { Minigame } from "@/lib/types";

interface ArenaStripProps {
  minigames: Minigame[];
  challengesDone: number;
}

export function ArenaStrip({ minigames, challengesDone }: ArenaStripProps) {
  return (
    <section className="mt-6">
      <h2 className="font-heading text-sm tracking-[0.3em] text-gold">
        A R E N A
      </h2>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        {minigames
          .slice()
          .sort((a, b) => a.slot - b.slot)
          .map((m) => (
            <ArenaCard
              key={m.key}
              minigame={m}
              challengesDone={challengesDone}
              unlocked={isArenaUnlocked(m, challengesDone)}
            />
          ))}
      </div>
    </section>
  );
}
