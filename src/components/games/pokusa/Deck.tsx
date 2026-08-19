"use client";

import { useEffect, useRef, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Card } from "./Card";
import { useCardTimer } from "./useCardTimer";
import { timerForCard } from "./deckBuilder";
import { fireShatter } from "@/components/fx/Confetti";
import { haptics } from "@/lib/utils/haptics";
import { sfx } from "@/lib/audio/sfx";
import type { MistakeReason, PokusaCard } from "./types";

export interface MistakeInfo {
  reason: MistakeReason;
  card: PokusaCard;
}

interface DeckProps {
  deck: PokusaCard[];
  frozen: boolean;
  onMistake: (info: MistakeInfo, cardCenter: { x: number; y: number }) => void;
  onProgress: (clearedCount: number) => void;
  onWin: () => void;
}

export function Deck({ deck, frozen, onMistake, onProgress, onWin }: DeckProps) {
  const [index, setIndex] = useState(0);
  const [screenWidth, setScreenWidth] = useState(360);
  const containerRef = useRef<HTMLDivElement>(null);
  const flingRef = useRef<((dir: "left" | "right") => void) | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [deck]);
  useEffect(() => {
    function measure() {
      if (containerRef.current) setScreenWidth(containerRef.current.getBoundingClientRect().width);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const current = deck[index];

  function cardCenter() {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0.5, y: 0.5 };
    return { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight };
  }

  function fail(reason: MistakeReason, card: PokusaCard) {
    sfx.error();
    haptics.error();
    fireShatter(cardCenter());
    onMistake({ reason, card }, cardCenter());
  }

  function handleDecide(accepted: boolean) {
    if (frozen || !current) return;
    const correct = accepted === (current.kind === "fiancee");
    if (correct) {
      sfx.tap();
      haptics.tap();
      const next = index + 1;
      onProgress(next);
      if (next >= deck.length) onWin();
      else setIndex(next);
    } else {
      // She was the fiancée and you swiped NIE, or she was a temptation and
      // you swiped TAK — the prototype tells these two apart (fail() reason).
      fail(current.kind === "fiancee" ? "rejected-her" : "accepted-temptation", current);
    }
  }

  function handleTimeout() {
    if (frozen || !current) return;
    fail("timeout", current);
  }

  const timerBarRef = useCardTimer({
    cardId: current?.id ?? "none",
    durationSec: timerForCard(index),
    active: !frozen && !!current,
    onExpire: handleTimeout,
    onWarnTick: sfx.tick,
  });

  const visible = deck.slice(index, index + 4);

  return (
    <div className="flex h-full flex-col">
      <div className="px-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            ref={timerBarRef}
            className="h-full w-full origin-left rounded-full"
            style={{ transform: "scaleX(1)", background: "var(--grad-cool)" }}
          />
        </div>
      </div>
      <div ref={containerRef} className="relative mx-4 mt-4 flex-1" style={{ perspective: 1200 }}>
        {visible.map((card, i) => (
          <Card
            key={card.id}
            card={card}
            stackIndex={i}
            index={index + i}
            deckSize={deck.length}
            screenWidth={screenWidth}
            interactive={i === 0 && !frozen}
            onDecide={handleDecide}
            registerFling={i === 0 ? (fn) => (flingRef.current = fn) : undefined}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 safe-bottom">
        <button
          onClick={() => flingRef.current?.("left")}
          disabled={frozen}
          className="flex h-16 items-center justify-center gap-2 rounded-2xl border-2 border-blood/40 bg-blood/10 font-heading text-lg text-blood disabled:opacity-40"
        >
          <ThumbsDown className="size-5" /> NIE
        </button>
        <button
          onClick={() => flingRef.current?.("right")}
          disabled={frozen}
          className="flex h-16 items-center justify-center gap-2 rounded-2xl border-2 border-mint/40 bg-mint/10 font-heading text-lg text-mint disabled:opacity-40"
        >
          <ThumbsUp className="size-5" /> TAK
        </button>
      </div>
    </div>
  );
}
