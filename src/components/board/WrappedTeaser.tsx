"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Lock, Sparkles } from "lucide-react";
import { haptics } from "@/lib/utils/haptics";
import { TOTAL_STEPS } from "@/lib/progress";

interface WrappedTeaserProps {
  total: number;
  isComplete: boolean;
}

/**
 * Always-visible entry point for WRAPPED — not just a screen that appears
 * out of nowhere at 18/18. Seeing it locked (with a live "x/18") the whole
 * time it's the actual extra pull to finish the last few tiles/arenas,
 * same job the progress bar does but as a concrete reward to look forward
 * to instead of an abstract number.
 */
export function WrappedTeaser({ total, isComplete }: WrappedTeaserProps) {
  if (isComplete) {
    return (
      <Link href="/wrapped" onClick={() => haptics.success()} className="mt-6 block">
        <motion.div
          animate={{ boxShadow: ["0 0 0px rgba(255,194,75,0)", "0 0 28px rgba(255,194,75,.5)", "0 0 0px rgba(255,194,75,0)"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3 rounded-2xl p-4"
          style={{ background: "var(--grad-gold)" }}
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-void/15">
            <Sparkles className="size-5 text-void" />
          </div>
          <div className="flex-1">
            <p className="font-heading text-lg leading-none text-void">WRAPPED gotowy</p>
            <p className="mt-1 text-xs text-void/70">18/18 — zobacz podsumowanie dnia</p>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 opacity-80">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/5">
        <Lock className="size-5 text-fog" />
      </div>
      <div className="flex-1">
        <p className="font-heading text-lg leading-none text-fog">WRAPPED</p>
        <p className="mt-1 text-xs text-fog/70">
          Odblokuje się przy {TOTAL_STEPS}/{TOTAL_STEPS} — jeszcze {TOTAL_STEPS - total} do końca.
        </p>
      </div>
      <span className="font-heading text-sm text-fog">
        {total}/{TOTAL_STEPS}
      </span>
    </div>
  );
}
