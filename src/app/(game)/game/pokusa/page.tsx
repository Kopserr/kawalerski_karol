import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { PokusaGame } from "@/components/games/pokusa/PokusaGame";
import { GlowCard } from "@/components/fx/GlowCard";
import { getBoardData } from "@/lib/data/board";
import { getMinigameByKey } from "@/lib/seed/minigames";
import { countChallengesDone, isArenaUnlocked } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function PokusaPage() {
  const data = await getBoardData();

  // Local-mode / no-backend fallback — see the identical note in
  // game/drink-runner/page.tsx.
  const challengesDone = data ? countChallengesDone(Object.values(data.tileStates)) : 12;
  const minigame = data?.minigames.find((m) => m.key === "pokusa") ?? getMinigameByKey("pokusa")!;
  const unlocked = isArenaUnlocked(minigame, challengesDone);

  if (!unlocked) {
    return (
      <main className="mx-auto flex h-dvh w-full max-w-[520px] flex-col items-center justify-center gap-4 bg-void px-6 text-center safe-x safe-top safe-bottom">
        <GlowCard className="flex w-full flex-col items-center gap-4 p-8">
          <div className="flex size-14 items-center justify-center rounded-full bg-white/5">
            <Lock className="size-7 text-fog" />
          </div>
          <h1 className="font-heading text-2xl">Pokusa zablokowana</h1>
          <p className="text-sm text-fog">
            Odblokuje się po {minigame.unlockAt} zaliczonych wyzwaniach.
            Aktualnie: {challengesDone}/{minigame.unlockAt}.
          </p>
          <Link
            href="/board"
            className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm text-off-white"
          >
            <ArrowLeft className="size-4" /> Wróć do planszy
          </Link>
        </GlowCard>
      </main>
    );
  }

  return <PokusaGame brideName={data?.brideName ?? null} bridePhoto={data?.bridePhoto ?? null} />;
}
