"use client";

import { motion } from "motion/react";
import { TOTAL_ARENAS, TOTAL_CHALLENGES, TOTAL_STEPS } from "@/lib/progress";

interface ProgressBarProps {
  challengesDone: number;
  arenasBeaten: number;
}

export function ProgressBar({ challengesDone, arenasBeaten }: ProgressBarProps) {
  const total = challengesDone + arenasBeaten;
  const pct = Math.round((total / TOTAL_STEPS) * 100);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between">
        <span className="font-heading text-sm tracking-wide text-fog">
          Postęp
        </span>
        <span className="font-heading text-xl text-off-white">
          {total}
          <span className="text-fog"> / {TOTAL_STEPS}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "var(--grad-cool)",
            boxShadow: "0 0 12px -2px var(--color-cyan)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className="mt-1.5 text-xs text-fog">
        wyzwania {challengesDone}/{TOTAL_CHALLENGES} · areny {arenasBeaten}/
        {TOTAL_ARENAS}
      </p>
    </div>
  );
}
