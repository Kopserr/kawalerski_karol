"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { haptics } from "@/lib/utils/haptics";

interface HoldToConfirmButtonProps {
  label: string;
  holdMs?: number;
  disabled?: boolean;
  onConfirm: () => void;
  className?: string;
}

/** Hold-to-confirm with an animated progress ring (BRIEF §8.3) — the only
 * way to actually trigger a restart, so it can't go off from one stray tap. */
export function HoldToConfirmButton({
  label,
  holdMs = 3000,
  disabled,
  onConfirm,
  className,
}: HoldToConfirmButtonProps) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const raf = useRef<number | null>(null);
  const startedAt = useRef(0);

  function stop() {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setHolding(false);
    setProgress(0);
  }

  function start() {
    if (disabled) return;
    setHolding(true);
    startedAt.current = performance.now();
    haptics.tap();

    function tick(now: number) {
      const pct = Math.min(1, (now - startedAt.current) / holdMs);
      setProgress(pct);
      if (pct >= 1) {
        haptics.error();
        onConfirm();
        stop();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
  }

  const circumference = 2 * Math.PI * 18;

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      whileTap={{ scale: 0.98 }}
      className={`relative flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-blood bg-blood/10 font-heading text-base tracking-wide text-blood disabled:opacity-40 ${className ?? ""}`}
    >
      <div
        className="absolute inset-0 bg-blood/30"
        style={{ transform: `scaleX(${progress})`, transformOrigin: "left", transition: holding ? "none" : "transform 0.2s ease-out" }}
      />
      <svg width="36" height="36" viewBox="0 0 40 40" className="relative -rotate-90">
        <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,71,87,0.25)" strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="#FF4757"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative">{holding ? "TRZYMAJ…" : label}</span>
    </motion.button>
  );
}
