"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { TitleSlide } from "./TitleSlide";
import { CounterSlide } from "./CounterSlide";
import { StatsSlide } from "./StatsSlide";
import { GallerySlide } from "./GallerySlide";
import { TimelineSlide } from "./TimelineSlide";
import { FinaleSlide } from "./FinaleSlide";
import { cn } from "@/lib/utils";
import type { WrappedData } from "./types";

const SLIDE_COUNT = 6;

/**
 * Stories shell (BRIEF §5.5): full-screen vertical slides. Tapping the
 * left/right side of a slide moves back/forward — but a couple of slides
 * have their own real scrolling (Timeline) or real buttons (Finale) that
 * legitimately need every one of their own taps, so a persistent chevron
 * footer (never overlapped by slide content — it's a layout sibling, not
 * an absolute overlay) is the guaranteed way to always move on.
 */
export function StoriesShell({ data }: { data: WrappedData }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  function go(delta: number) {
    setDirection(delta);
    setIndex((i) => Math.max(0, Math.min(SLIDE_COUNT - 1, i + delta)));
  }

  function advance() {
    if (index === SLIDE_COUNT - 1) router.push("/board");
    else go(1);
  }

  function handleTap(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fromLeft = (e.clientX - rect.left) / rect.width;
    if (fromLeft < 0.35) {
      if (index > 0) go(-1);
    } else {
      advance();
    }
  }

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-void safe-x safe-top safe-bottom">
      <div className="safe-top flex items-center gap-3 px-4 pt-3">
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-off-white transition-all duration-300"
                style={{ width: i <= index ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push("/board")}
          aria-label="Zamknij"
          className="flex size-8 items-center justify-center rounded-full bg-void/60"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1" onClick={handleTap}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {index === 0 && <TitleSlide eventDateLabel={data.eventDateLabel} />}
            {index === 1 && <CounterSlide />}
            {index === 2 && <StatsSlide stats={data.stats} />}
            {index === 3 && <GallerySlide gallery={data.gallery} />}
            {index === 4 && <TimelineSlide gallery={data.gallery} tiles={data.tiles} />}
            {index === 5 && <FinaleSlide data={data} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Persistent footer — never covered by a slide, always clickable. */}
      <div className="safe-bottom flex items-center justify-between px-4 py-3">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Poprzedni slajd"
          className={cn(
            "flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-off-white",
            index === 0 && "opacity-30",
          )}
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-xs uppercase tracking-[0.3em] text-fog">
          {index + 1} / {SLIDE_COUNT}
        </span>
        <button
          onClick={advance}
          aria-label="Następny slajd"
          className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-off-white"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </main>
  );
}
