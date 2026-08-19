"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, type PanInfo } from "motion/react";
import { avatarFor } from "./avatar";
import { cn } from "@/lib/utils";
import type { PokusaCard } from "./types";

interface CardProps {
  card: PokusaCard;
  stackIndex: number;
  index: number; // 0-based position in the full 20-card deck, for the "01/20" badge
  deckSize: number;
  screenWidth: number;
  interactive: boolean;
  onDecide: (accepted: boolean) => void;
  registerFling?: (fn: (dir: "left" | "right") => void) => void;
}

const FLING_SPRING = { type: "spring", stiffness: 260, damping: 30 } as const;

/** Prototype caps the swipe threshold at 120px even on wide screens —
 * without it, tablets/desktops need an unreasonably long drag. */
function swipeThreshold(screenWidth: number) {
  return Math.min(120, screenWidth * 0.28);
}

/** One card in the Pokusa stack — the fling physics from BRIEF §7.2:
 * rotate = dx * 0.06deg, threshold to commit, spring back below that. This
 * is the single most polished animation in the whole game. */
export function Card({
  card,
  stackIndex,
  index,
  deckSize,
  screenWidth,
  interactive,
  onDecide,
  registerFling,
}: CardProps) {
  const x = useMotionValue(0);
  const flyY = useMotionValue(0);
  const rotate = useTransform(x, (v) => v * 0.06);
  const threshold = swipeThreshold(screenWidth);
  const acceptGlow = useTransform(x, [0, threshold], [0, 1]);
  const rejectGlow = useTransform(x, [0, -threshold], [0, 1]);

  useEffect(() => {
    if (!interactive || !registerFling) return;
    registerFling((dir) => {
      const target = dir === "right" ? screenWidth * 1.3 : -screenWidth * 1.3;
      void animate(x, target, FLING_SPRING).then(() => onDecide(dir === "right"));
      void animate(flyY, -40 + Math.random() * 80, FLING_SPRING);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, screenWidth]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    const commit = Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > 900;
    if (commit) {
      const accepted = info.offset.x > 0;
      const target = accepted ? screenWidth * 1.3 : -screenWidth * 1.3;
      void animate(x, target, { ...FLING_SPRING, velocity: info.velocity.x }).then(() => onDecide(accepted));
      void animate(flyY, -40 + Math.random() * 80, FLING_SPRING);
    } else {
      void animate(x, 0, { type: "spring", stiffness: 320, damping: 22 });
    }
  }

  const avatar = avatarFor(card.avatarSeed);
  const trapBorder = card.kind === "fiancee" || card.sameBorderTrap;

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        zIndex: 20 - stackIndex,
        y: stackIndex * 34,
        scale: Math.pow(0.96, stackIndex),
        filter: stackIndex ? `brightness(${(1 - stackIndex * 0.22).toFixed(2)})` : undefined,
        // Background cards (stackIndex > 0) are purely decorative and, once
        // offset downward, overhang the container into the NIE/TAK buttons
        // below — without this they physically block those clicks.
        pointerEvents: stackIndex ? "none" : undefined,
      }}
      initial={false}
      animate={{ y: stackIndex * 34, scale: Math.pow(0.96, stackIndex) }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <motion.div
        drag={interactive ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={interactive ? handleDragEnd : undefined}
        style={{ x, y: flyY, rotate, pointerEvents: interactive ? "auto" : "none" }}
        className={cn(
          "glass relative flex h-full w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 [transform-style:preserve-3d]",
          trapBorder ? "border-gold shadow-[0_0_32px_-8px_var(--color-gold)]" : "border-white/10",
        )}
      >
        <span className="absolute left-4 top-4 text-[10px] font-bold uppercase tracking-[0.2em] text-fog">
          {String(index + 1).padStart(2, "0")} / {deckSize}
        </span>
        {interactive && (
          <>
            <motion.div
              style={{ opacity: rejectGlow }}
              className="pointer-events-none absolute inset-0 flex items-center justify-start rounded-3xl bg-blood/20 pl-6"
            >
              <span className="rounded-xl border-2 border-blood px-3 py-1 font-heading text-2xl text-blood">
                NIE
              </span>
            </motion.div>
            <motion.div
              style={{ opacity: acceptGlow }}
              className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-3xl bg-mint/20 pr-6"
            >
              <span className="rounded-xl border-2 border-mint px-3 py-1 font-heading text-2xl text-mint">
                TAK
              </span>
            </motion.div>
          </>
        )}

        <div
          className="flex size-28 items-center justify-center overflow-hidden rounded-full border-2 border-white/15 text-5xl"
          style={
            card.photoUrl
              ? undefined
              : { background: `linear-gradient(135deg, ${avatar.gradient[0]}, ${avatar.gradient[1]})` }
          }
        >
          {card.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.photoUrl} alt="" className="size-full object-cover" draggable={false} />
          ) : (
            <span>{avatar.emoji}</span>
          )}
        </div>

        <p className="px-6 text-center font-heading text-xl leading-tight text-off-white">
          {card.label}
        </p>
        <p className="-mt-2 max-w-[85%] px-4 text-center text-xs text-fog">{card.flav}</p>
      </motion.div>
    </motion.div>
  );
}
