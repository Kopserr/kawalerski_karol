"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Beer, Trophy } from "lucide-react";
import { DrinkRunnerCanvas } from "./DrinkRunnerCanvas";
import { DrinkRunnerEngine } from "./Engine";
import { fireConfetti } from "@/components/fx/Confetti";
import { useGameStore } from "@/lib/store/useGameStore";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { haptics } from "@/lib/utils/haptics";

const BEST_KEY = "lfd-drink-runner-best";
const WIN_TARGET = DrinkRunnerEngine.winDrinks;

function readBest(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(BEST_KEY) ?? 0);
}

interface DrinkRunnerGameProps {
  groomPhoto: string | null;
  bridePhoto: string | null;
}

export function DrinkRunnerGame({ groomPhoto, bridePhoto }: DrinkRunnerGameProps) {
  const recordMinigameResult = useGameStore((s) => s.recordMinigameResult);
  const [status, setStatus] = useState<"playing" | "gameover" | "won">("playing");
  const [count, setCount] = useState(0);
  const [best, setBest] = useState(0);
  const [restartToken, setRestartToken] = useState(0);
  const startedAt = useRef(Date.now());

  useEffect(() => setBest(readBest()), []);
  useWakeLock(status === "playing");

  function handleDrinkCollected(n: number) {
    setCount(n);
  }

  function handleGameOver() {
    setStatus("gameover");
    const durationMs = Date.now() - startedAt.current;
    void recordMinigameResult("drink-runner", false, count, durationMs);
  }

  function handleWin() {
    setStatus("won");
    fireConfetti({ gold: true, particleCount: 160 });
    const durationMs = Date.now() - startedAt.current;
    void recordMinigameResult("drink-runner", true, WIN_TARGET, durationMs);
    if (WIN_TARGET > best) {
      localStorage.setItem(BEST_KEY, String(WIN_TARGET));
      setBest(WIN_TARGET);
    }
  }

  function restart() {
    haptics.tap();
    setCount(0);
    setStatus("playing");
    startedAt.current = Date.now();
    setRestartToken((t) => t + 1);
  }

  useEffect(() => {
    if (status !== "gameover") return;
    if (count > best) {
      localStorage.setItem(BEST_KEY, String(count));
      setBest(count);
    }
  }, [status, count, best]);

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-void safe-x safe-top safe-bottom">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <Link
          href="/arena"
          className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-void/60 backdrop-blur"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="glow-gold flex items-center gap-1.5 rounded-full border border-gold/30 bg-void/60 px-4 py-2 font-heading text-lg backdrop-blur">
          <Beer className="size-4 text-gold" />
          <span className="text-gold">{count}</span>
          <span className="text-fog">/ {WIN_TARGET}</span>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-void/60 px-3 py-2 text-xs text-fog backdrop-blur">
          <Trophy className="size-3.5 text-gold" /> {best}
        </div>
      </header>

      <div className="flex-1">
        <DrinkRunnerCanvas
          groomPhoto={groomPhoto}
          bridePhoto={bridePhoto}
          restartToken={restartToken}
          onDrinkCollected={handleDrinkCollected}
          onGameOver={handleGameOver}
          onWin={handleWin}
        />
      </div>

      <AnimatePresence>
        {status === "gameover" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-void/85 px-8 text-center backdrop-blur-sm"
          >
            <motion.h1
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="heading-hero font-heading text-blood"
              style={{ fontSize: "clamp(1.75rem,9vw,2.75rem)" }}
            >
              ZOSTAŁEŚ
              <br />
              PRZYŁAPANY
            </motion.h1>
            <p className="text-sm text-fog">
              Wypite: {count} / {WIN_TARGET} · rekord {best}
            </p>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={restart}
              className="glow-magenta rounded-full px-8 py-4 font-heading text-lg tracking-wide text-off-white"
              style={{ background: "var(--grad-hot)" }}
            >
              JESZCZE RAZ
            </motion.button>
          </motion.div>
        )}

        {status === "won" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 px-8 text-center"
            style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,194,75,0.35), rgba(5,6,11,0.92))" }}
          >
            <motion.h1
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="heading-hero text-glow-gold font-heading"
              style={{ fontSize: "clamp(1.75rem,9vw,2.75rem)" }}
            >
              WYPIŁEŚ
              <br />Z KAŻDYM
            </motion.h1>
            <p className="text-sm text-fog">ARENA I zaliczona.</p>
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
