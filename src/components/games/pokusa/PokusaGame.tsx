"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Heart, Target } from "lucide-react";
import { Deck, type MistakeInfo } from "./Deck";
import { buildDeck, POKUSA_DECK_SIZE } from "./deckBuilder";
import { fireConfetti } from "@/components/fx/Confetti";
import { useGameStore } from "@/lib/store/useGameStore";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import type { PokusaCard } from "./types";

const FARTHEST_KEY = "lfd-pokusa-farthest";

/** The prototype's `fail(reason, card)` distinguishes three distinct beats,
 * not one generic "you messed up" — ported 1:1. */
function mistakeCopy(info: MistakeInfo | null): { title: [string, string]; message: string } {
  if (!info) return { title: ["Ona to", "zobaczyła"], message: "Zaczynasz od nowa." };
  switch (info.reason) {
    case "timeout":
      return { title: ["Za długo", "myślałeś"], message: "Zawahałeś się. To wystarczyło." };
    case "rejected-her":
      return { title: ["Ona to", "zobaczyła"], message: "To była ona. Odrzuciłeś własną narzeczoną." };
    case "accepted-temptation":
      return { title: ["Ona to", "zobaczyła"], message: `„${info.card.label}” — serio?` };
  }
}

function readFarthest(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(FARTHEST_KEY) ?? 0);
}

function preloadImage(src: string | null): Promise<void> {
  return new Promise((resolve) => {
    if (!src) return resolve();
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

interface PokusaGameProps {
  brideName: string | null;
  bridePhoto: string | null;
}

export function PokusaGame({ brideName, bridePhoto }: PokusaGameProps) {
  const recordMinigameResult = useGameStore((s) => s.recordMinigameResult);
  const [phase, setPhase] = useState<"preparing" | "playing" | "mistake" | "won">("preparing");
  const [deck, setDeck] = useState<PokusaCard[]>([]);
  const [cleared, setCleared] = useState(0);
  const [farthest, setFarthest] = useState(0);
  const [lastMistake, setLastMistake] = useState<MistakeInfo | null>(null);
  const startedAt = useRef(Date.now());

  useWakeLock(phase === "playing");

  useEffect(() => {
    setFarthest(readFarthest());
    let cancelled = false;
    const minDelay = new Promise((r) => setTimeout(r, 650));
    void Promise.all([preloadImage(bridePhoto), minDelay]).then(() => {
      if (cancelled) return;
      setDeck(buildDeck({ brideName, bridePhoto }));
      setPhase("playing");
      startedAt.current = Date.now();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function bumpFarthest(n: number) {
    setCleared(n);
    if (n > farthest) {
      setFarthest(n);
      localStorage.setItem(FARTHEST_KEY, String(n));
    }
  }

  function handleMistake(info: MistakeInfo) {
    setPhase("mistake");
    setLastMistake(info);
    const durationMs = Date.now() - startedAt.current;
    void recordMinigameResult("pokusa", false, cleared, durationMs);
    setTimeout(() => {
      setDeck(buildDeck({ brideName, bridePhoto }));
      setCleared(0);
      startedAt.current = Date.now();
      setPhase("playing");
    }, 1400);
  }

  function handleWin() {
    setPhase("won");
    fireConfetti({ gold: true, particleCount: 160 });
    const durationMs = Date.now() - startedAt.current;
    void recordMinigameResult("pokusa", true, POKUSA_DECK_SIZE, durationMs);
    if (POKUSA_DECK_SIZE > farthest) {
      localStorage.setItem(FARTHEST_KEY, String(POKUSA_DECK_SIZE));
      setFarthest(POKUSA_DECK_SIZE);
    }
  }

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-[520px] flex-col bg-void safe-x safe-top safe-bottom">
      <header className="flex items-center justify-between px-4 pt-2">
        <Link
          href="/arena"
          className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="glow-magenta flex items-center gap-1.5 rounded-full border border-magenta/30 bg-white/5 px-4 py-2 font-heading text-lg">
          <Heart className="size-4 text-magenta" />
          <span className="text-magenta">{cleared}</span>
          <span className="text-fog">/ {POKUSA_DECK_SIZE}</span>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-fog">
          <Target className="size-3.5 text-gold" /> {farthest}/{POKUSA_DECK_SIZE}
        </div>
      </header>

      {phase === "preparing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <div className="size-10 animate-spin rounded-full border-2 border-magenta/30 border-t-magenta" />
          <p className="text-xs uppercase tracking-[0.3em] text-fog">Przygotowanie talii…</p>
        </div>
      )}

      {(phase === "playing" || phase === "mistake") && deck.length > 0 && (
        <Deck
          deck={deck}
          frozen={phase === "mistake"}
          onMistake={handleMistake}
          onProgress={bumpFarthest}
          onWin={handleWin}
        />
      )}

      <AnimatePresence>
        {phase === "mistake" && (() => {
          const copy = mistakeCopy(lastMistake);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: [0, -10, 10, -8, 8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ x: { duration: 0.4 } }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-blood/10 px-8 text-center backdrop-blur-sm"
            >
              <h1 className="font-heading text-3xl text-blood">
                {copy.title[0]}
                <br />
                {copy.title[1]}
              </h1>
              <p className="text-sm text-fog">{copy.message}</p>
              <p className="mt-2 text-xs text-fog/70">
                Najdalej: {farthest}/{POKUSA_DECK_SIZE} · zaczynasz od nowa
              </p>
            </motion.div>
          );
        })()}

        {phase === "won" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 px-8 text-center"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(255,194,75,0.35), rgba(5,6,11,0.92))",
            }}
          >
            <motion.h1
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="heading-hero text-glow-gold font-heading"
              style={{ fontSize: "clamp(1.75rem,9vw,2.75rem)" }}
            >
              PRZESZEDŁEŚ
              <br />
              PRÓBĘ
            </motion.h1>
            <p className="text-sm text-fog">ARENA II zaliczona.</p>
            <Link
              href="/arena"
              className="glow-gold rounded-full px-8 py-4 font-heading text-lg tracking-wide text-void"
              style={{ background: "var(--grad-gold)" }}
            >
              WRÓĆ DO AREN
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
