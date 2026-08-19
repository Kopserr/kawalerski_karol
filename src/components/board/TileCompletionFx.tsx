"use client";

import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { haptics } from "@/lib/utils/haptics";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const ParticleBurst = dynamic(() => import("@/components/three/ParticleBurst"), {
  ssr: false,
});

interface TileCompletionFxProps {
  onDone: () => void;
}

/** The "opening a loot crate" moment: gold particle burst + shockwave
 * across the board + haptic, ~1.6s total (BRIEF §4.3). */
export function TileCompletionFx({ onDone }: TileCompletionFxProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    haptics.success();
    const t = setTimeout(onDone, reducedMotion ? 300 : 1600);
    return () => clearTimeout(t);
  }, [onDone, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <ParticleBurst color="#FFC24B" count={110} durationMs={900} />
        </Suspense>
      </div>
      <motion.div
        initial={{ scale: 0, opacity: 0.9 }}
        animate={{ scale: 5, opacity: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="size-24 rounded-full"
        style={{
          border: "2px solid var(--color-gold)",
          boxShadow: "0 0 60px 10px var(--color-gold)",
        }}
      />
    </div>
  );
}
