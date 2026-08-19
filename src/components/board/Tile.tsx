"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORY_ICON } from "@/lib/categories";
import { haptics } from "@/lib/utils/haptics";
import type { Tile as TileT, TileState } from "@/lib/types";

interface TileProps {
  tile: TileT;
  tileState: TileState;
  tilt?: { rx: number; ry: number };
  /** false for the read-only /live view (BRIEF §5.4) — no link, no press states. */
  interactive?: boolean;
}

const LONG_PRESS_MS = 450;

export function Tile({ tile, tileState, tilt, interactive = true }: TileProps) {
  const Icon = CATEGORY_ICON[tile.category];
  const [peeking, setPeeking] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const pathname = usePathname();

  const state = tileState.state;
  const isInteractive =
    interactive && (state === "locked" || state === "active" || state === "rejected");
  // Its own /tile/[id] modal is currently open on top of this tile — hand the
  // shared layoutId off to TaskCard entirely instead of both elements
  // holding it at once. Two permanently-mounted nodes sharing a layoutId
  // fight over the projection on every re-render (e.g. PENDING → the modal
  // visibly snaps back toward the grid) instead of just animating the open/
  // close transition once.
  const modalOwnsSharedId = pathname === `/tile/${tile.id}`;

  function startPress() {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      haptics.tap();
      setPeeking(true);
    }, LONG_PRESS_MS);
  }
  function endPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (peeking) {
      setTimeout(() => setPeeking(false), 1200);
    }
  }

  const content = (
    <motion.div
      layoutId={modalOwnsSharedId ? undefined : `tile-${tile.id}`}
      initial={false}
      whileTap={isInteractive ? { scale: 0.94 } : undefined}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onClick={() => {
        if (longPressed.current) return;
        if (isInteractive) haptics.tap();
      }}
      style={
        tilt
          ? {
              transform: `perspective(600px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            }
          : undefined
      }
      className={cn(
        "relative aspect-square overflow-hidden rounded-2xl border no-select [transform-style:preserve-3d]",
        state === "locked" &&
          "border-white/10 bg-white/[0.03] backdrop-blur-xl",
        state === "active" &&
          "animate-pulse-glow border-cyan/70 bg-white/[0.05] backdrop-blur-xl",
        state === "pending" &&
          "border-gold bg-white/[0.05] backdrop-blur-xl shadow-[0_0_24px_-6px_var(--color-gold)]",
        state === "done" && "border-transparent text-void",
        state === "rejected" && "border-blood bg-blood/10",
      )}
    >
      {/* LOCKED shimmer sweep */}
      {state === "locked" && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="animate-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}

      {/* DONE fill */}
      {state === "done" && (
        <div
          className="absolute inset-0"
          style={{
            // --grad-gold is already a full linear-gradient(...) value —
            // wrapping it in another linear-gradient() is invalid CSS and
            // silently drops the ENTIRE background-image (both layers),
            // which is why a done tile with a proof photo used to render
            // as an invisible hole in the board.
            backgroundImage: tileState.proofUrl
              ? `var(--grad-gold), url(${tileState.proofUrl})`
              : "var(--grad-gold)",
            backgroundBlendMode: tileState.proofUrl ? "overlay" : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-1 p-1 text-center">
        {state !== "done" && (
          <>
            <Icon
              className={cn(
                "size-4 opacity-60",
                state === "active" && "text-cyan opacity-100",
                state === "pending" && "text-gold opacity-100",
                state === "rejected" && "text-blood opacity-100",
              )}
              strokeWidth={2.25}
            />
            <span
              className={cn(
                "font-heading text-lg leading-none text-fog",
                state === "active" && "text-cyan text-glow-cyan",
                state === "pending" && "text-gold",
                state === "rejected" && "text-blood",
              )}
            >
              {String(tile.id).padStart(2, "0")}
            </span>
          </>
        )}

        {state === "active" && (
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cyan/15 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-cyan">
            W trakcie
          </span>
        )}
        {state === "pending" && (
          <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gold/15 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-gold">
            <Loader2 className="size-2.5 animate-spin" />
            Czeka
          </span>
        )}
        {state === "rejected" && (
          <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-blood/15 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-blood">
            <X className="size-2.5" />
            Wróć
          </span>
        )}
        {state === "done" && (
          <Check className="size-7 text-void drop-shadow-[0_1px_2px_rgba(0,0,0,.4)]" strokeWidth={3} />
        )}
      </div>

      {peeking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-0.5 bg-void/90 p-1 text-center backdrop-blur-sm"
        >
          <span className="text-[8px] font-semibold uppercase tracking-wider text-cyan">
            {tile.category}
          </span>
          {tile.location && (
            <span className="text-[7px] text-fog">{tile.location}</span>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  if (!isInteractive) {
    return <div className="[perspective:600px]">{content}</div>;
  }

  return (
    <Link
      href={`/tile/${tile.id}`}
      aria-label={`Zadanie ${tile.id}: ${tile.title}`}
      className="[perspective:600px]"
      onClick={(e) => {
        if (longPressed.current) e.preventDefault();
      }}
    >
      {content}
    </Link>
  );
}
