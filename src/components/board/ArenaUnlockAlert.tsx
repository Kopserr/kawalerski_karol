"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { Beer, Heart } from "lucide-react";
import { haptics } from "@/lib/utils/haptics";
import type { MinigameKey } from "@/lib/types";

interface ArenaUnlockAlertProps {
  arenaKey: MinigameKey;
  onDone: () => void;
}

const LABEL: Record<MinigameKey, string> = {
  "drink-runner": "ARENA I ODBLOKOWANA",
  pokusa: "ARENA II ODBLOKOWANA",
};

const ICON = { "drink-runner": Beer, pokusa: Heart };

/** Full-screen event, not a silent state change (BRIEF §5.2). */
export function ArenaUnlockAlert({ arenaKey, onDone }: ArenaUnlockAlertProps) {
  const Icon = ICON[arenaKey];

  useEffect(() => {
    haptics.success();
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-void/85 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.3, 1], opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glow-cyan flex size-20 items-center justify-center rounded-full"
        style={{ background: "var(--grad-cool)" }}
      >
        <Icon className="size-10 text-void" />
      </motion.div>
      <motion.h1
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="heading-hero text-glow-cyan px-6 text-center font-heading text-[clamp(1.75rem,9vw,3.25rem)]"
      >
        {LABEL[arenaKey]}
      </motion.h1>
    </motion.div>
  );
}
