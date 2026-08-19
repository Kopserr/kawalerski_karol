"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { GradientMesh } from "@/components/fx/GradientMesh";
import { requestTiltPermission } from "@/lib/hooks/useDeviceTilt";

const EVENT_DATE = process.env.NEXT_PUBLIC_EVENT_DATE ?? "2026-09-12";

function formatEventDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Splash / intro (BRIEF §5.1). Originally an R3F glass coin with a trapped
 * gold ring — swapped for a pure CSS/Motion version: the WebGL scene was
 * janky on exactly the screen that sets the whole app's first impression.
 * This reads the same "coin with a ring inside" metaphor, costs ~0 extra
 * JS, and respects prefers-reduced-motion for free via the global rule in
 * globals.css (no WebGL context to separately gate).
 */
export default function SplashPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const duration = 1100;
    const id = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / duration) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        setReady(true);
      }
    }, 30);
    return () => clearInterval(id);
  }, []);

  async function handleStart() {
    await requestTiltPermission();
    router.push("/gate");
  }

  return (
    <main className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-void safe-x safe-top safe-bottom">
      <GradientMesh />

      <AnimatePresence mode="wait">
        {!ready ? (
          <motion.div
            key="loader"
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <div className="relative size-16 rounded-full border border-white/15">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(var(--color-cyan) ${progress}%, transparent ${progress}%)`,
                  mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
                  WebkitMask:
                    "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-heading text-sm text-cyan">
                {progress}%
              </span>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-fog">
              Ładowanie wieczoru…
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center gap-8 px-6 text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex size-48 items-center justify-center"
            >
              <Coin />
            </motion.div>

            <div>
              <h1 className="heading-hero text-glow-cyan font-heading">
                LAST
                <br />
                FREE DAY
              </h1>
              <p className="mt-3 font-accent text-xl italic text-fog">
                Malta · {formatEventDate(EVENT_DATE)}
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleStart}
              className="glow-magenta flex items-center gap-2 rounded-full px-8 py-4 font-heading text-lg tracking-wide text-off-white"
              style={{ background: "var(--grad-hot)" }}
            >
              ZACZYNAMY <ArrowRight className="size-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/** Glass coin with a trapped gold ring, CSS/Motion only — a rotating
 * conic-gradient sheen stands in for glass refraction (same trick as
 * ArenaCard's unlocked border), a radial highlight fakes a glass
 * reflection, and the ring itself is a conic-gradient disc with the
 * center masked out. All GPU-cheap transform/opacity work, nothing that
 * can drop frames on an old phone. */
function Coin() {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="relative flex size-48 items-center justify-center"
    >
      <div className="glass absolute inset-0 overflow-hidden rounded-full border border-white/15">
        <div
          className="animate-spin-slower absolute -inset-1/2"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(255,255,255,0.14), transparent 30%, transparent 55%, rgba(255,255,255,0.2), transparent 85%)",
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-3 rounded-full"
        style={{
          background: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.16), transparent 55%)",
        }}
      />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        className="glow-gold relative flex size-24 items-center justify-center rounded-full p-[5px]"
        style={{ background: "conic-gradient(from 0deg, #FFC24B, #FF8A3D, #FFC24B)" }}
      >
        <div className="size-full rounded-full bg-void" />
      </motion.div>
      <div className="animate-pulse-glow pointer-events-none absolute size-24 rounded-full" />
    </motion.div>
  );
}
