"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { fireConfetti } from "@/components/fx/Confetti";
import { haptics } from "@/lib/utils/haptics";

interface BingoBurstProps {
  onDone: () => void;
}

/** Full-screen "BINGO!" celebration — a micro-reward, doesn't end the game (BRIEF §5.2). */
export function BingoBurst({ onDone }: BingoBurstProps) {
  useEffect(() => {
    haptics.bingo();
    fireConfetti({ particleCount: 140 });
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 backdrop-blur-sm"
    >
      <motion.h1
        initial={{ scale: 0.6, rotate: -6, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="heading-hero text-glow-gold bg-clip-text font-heading text-transparent"
        style={{ backgroundImage: "var(--grad-gold)" }}
      >
        BINGO!
      </motion.h1>
    </motion.div>
  );
}
