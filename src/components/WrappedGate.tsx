"use client";

import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { GlowCard } from "@/components/fx/GlowCard";
import { StoriesShell } from "@/components/wrapped/StoriesShell";
import { useGameStore, type ServerHydration } from "@/lib/store/useGameStore";
import { useServerSync } from "@/lib/hooks/useServerSync";
import { computeProgress, TOTAL_ARENAS, TOTAL_CHALLENGES } from "@/lib/progress";
import { computeWrappedStats } from "@/lib/wrapped/computeStats";
import type { WrappedExtras } from "@/lib/data/wrapped";
import type { WrappedData } from "@/components/wrapped/types";

const EVENT_DATE = process.env.NEXT_PUBLIC_EVENT_DATE ?? "2026-09-12";
const GROOM_NAME = process.env.NEXT_PUBLIC_GROOM_NAME ?? "";

function formatEventDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "long", year: "numeric" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export function WrappedGate({
  initial,
  extras,
}: {
  initial: ServerHydration | null;
  extras: WrappedExtras | null;
}) {
  useServerSync(initial);

  const tiles = useGameStore((s) => s.tiles);
  const tileStates = useGameStore((s) => s.tileStates);
  const minigames = useGameStore((s) => s.minigames);
  const events = useGameStore((s) => s.events);
  const startedAt = useGameStore((s) => s.startedAt);
  const brideName = useGameStore((s) => s.brideName);
  const progress = computeProgress(Object.values(tileStates), minigames);

  if (!progress.isComplete) {
    return (
      <main className="mx-auto flex h-dvh w-full max-w-[520px] flex-col items-center justify-center gap-4 bg-void px-6 text-center safe-x safe-top safe-bottom">
        <GlowCard className="flex w-full flex-col items-center gap-4 p-8">
          <div className="flex size-14 items-center justify-center rounded-full bg-white/5">
            <Lock className="size-7 text-fog" />
          </div>
          <h1 className="font-heading text-2xl">WRAPPED zamknięty</h1>
          <p className="text-sm leading-relaxed text-fog">
            Odblokuje się dopiero, gdy zaliczysz{" "}
            <strong className="text-off-white">
              {TOTAL_CHALLENGES}/{TOTAL_CHALLENGES}
            </strong>{" "}
            wyzwań i przejdziesz{" "}
            <strong className="text-off-white">
              {TOTAL_ARENAS}/{TOTAL_ARENAS}
            </strong>{" "}
            areny. Jedno bez drugiego nie wystarczy.
          </p>
          <p className="text-xs text-fog/70">
            Aktualnie: {progress.challengesDone}/{TOTAL_CHALLENGES} wyzwań ·{" "}
            {progress.arenasBeaten}/{TOTAL_ARENAS} aren
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

  // extras is null in local mode (no Supabase) — fall back to what the
  // client store already has (approved proofs live on tileStates there).
  const gallery =
    extras?.gallery ??
    tiles
      .filter((t) => tileStates[t.id]?.proofUrl)
      .map((t) => ({
        tileId: t.id,
        tileTitle: t.title,
        mediaUrl: tileStates[t.id].proofUrl!,
        mediaType: tileStates[t.id].proofType ?? ("image" as const),
        createdAt: tileStates[t.id].completedAt ?? new Date().toISOString(),
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const fullEvents = extras?.events ?? events;

  const stats = computeWrappedStats({
    tiles,
    tileStates,
    minigames,
    events: fullEvents,
    startedAt,
    pokusaFarthestBeforeWin: extras?.pokusaFarthestBeforeWin ?? null,
  });

  const data: WrappedData = {
    tiles,
    tileStates,
    minigames,
    events: fullEvents,
    gallery,
    stats,
    groomName: GROOM_NAME,
    brideName: brideName ?? "",
    eventDateLabel: formatEventDate(EVENT_DATE),
  };

  return <StoriesShell data={data} />;
}
