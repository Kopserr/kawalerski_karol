"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Lock, Trophy, Beer, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Minigame } from "@/lib/types";

interface ArenaCardProps {
  minigame: Minigame;
  challengesDone: number;
  unlocked: boolean;
}

const ICON = {
  "drink-runner": Beer,
  pokusa: Heart,
} as const;

const ROUTE = {
  "drink-runner": "/game/drink-runner",
  pokusa: "/game/pokusa",
} as const;

export function ArenaCard({ minigame, challengesDone, unlocked }: ArenaCardProps) {
  const Icon = ICON[minigame.key];
  const slotLabel = minigame.slot === 1 ? "Arena I" : "Arena II";

  const inner = (
    <div className="relative z-10 flex h-full flex-col justify-between rounded-2xl bg-abyss p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-fog">
          {slotLabel}
        </span>
        {minigame.beaten ? (
          <Trophy className="size-4 text-gold" />
        ) : unlocked ? null : (
          <Lock className="size-4 text-fog" />
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Icon
          className={cn(
            "size-6",
            minigame.beaten ? "text-gold" : unlocked ? "text-cyan" : "text-fog",
          )}
        />
        <span className="font-heading text-lg leading-none">
          {minigame.title}
        </span>
      </div>

      <div className="mt-4">
        {minigame.beaten ? (
          <p className="text-xs text-gold">
            Ukończona · wynik {minigame.bestScore}
          </p>
        ) : unlocked ? (
          <span className="inline-block rounded-full bg-cyan/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan">
            Zagraj
          </span>
        ) : (
          <p className="text-xs text-fog">
            {challengesDone}/{minigame.unlockAt} wyzwań
          </p>
        )}
      </div>
    </div>
  );

  if (minigame.beaten) {
    return (
      <div className="rounded-2xl p-[1.5px]" style={{ background: "var(--grad-gold)" }}>
        {inner}
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] opacity-60 saturate-50">
        {inner}
      </div>
    );
  }

  return (
    <Link href={ROUTE[minigame.key]} className="block">
      <motion.div
        whileTap={{ scale: 0.96 }}
        className="relative overflow-hidden rounded-2xl p-[2px]"
      >
        <div
          className="animate-spin-slower absolute -inset-1/2"
          style={{
            background:
              "conic-gradient(from 0deg, var(--color-cyan), var(--color-magenta), var(--color-gold), var(--color-cyan))",
          }}
        />
        {inner}
      </motion.div>
    </Link>
  );
}
