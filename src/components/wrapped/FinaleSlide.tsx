"use client";

import { Suspense, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Download, Loader2, Share2 } from "lucide-react";
import { ShareCard } from "./ShareCard";
import { renderSummaryImage, shareSummaryImage, downloadBlob } from "@/lib/wrapped/exportSummary";
import { haptics } from "@/lib/utils/haptics";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import type { WrappedData } from "./types";

const ClosingRing = dynamic(() => import("@/components/three/ClosingRing"), { ssr: false });

/** Slide 6 (BRIEF §5.5) — the closing beat: ring animation, download +
 * share the 1080×1920 summary card. */
export function FinaleSlide({ data }: { data: WrappedData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const reducedMotion = useReducedMotion();

  async function handleDownload() {
    if (!cardRef.current) return;
    setBusy("download");
    haptics.tap();
    const blob = await renderSummaryImage(cardRef.current);
    if (blob) downloadBlob(blob, "last-free-day.png");
    setBusy(null);
  }

  async function handleShare() {
    if (!cardRef.current) return;
    setBusy("share");
    haptics.tap();
    const blob = await renderSummaryImage(cardRef.current);
    if (blob) await shareSummaryImage(blob, "LAST FREE DAY");
    setBusy(null);
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden px-8 text-center">
      {!reducedMotion && (
        <div className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <ClosingRing />
          </Suspense>
        </div>
      )}

      <motion.h1
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="heading-hero text-glow-gold relative z-30 font-heading text-gold"
      >
        KONIEC
        <br />
        WOLNOŚCI
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-30 flex w-full max-w-xs flex-col gap-3"
      >
        <button
          onClick={handleDownload}
          disabled={busy !== null}
          className="glow-gold flex h-14 items-center justify-center gap-2 rounded-full font-heading text-base tracking-wide text-void disabled:opacity-60"
          style={{ background: "var(--grad-gold)" }}
        >
          {busy === "download" ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
          POBIERZ PODSUMOWANIE
        </button>
        <button
          onClick={handleShare}
          disabled={busy !== null}
          className="flex h-14 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 font-heading text-base tracking-wide text-off-white disabled:opacity-60"
        >
          {busy === "share" ? <Loader2 className="size-5 animate-spin" /> : <Share2 className="size-5" />}
          UDOSTĘPNIJ
        </button>
      </motion.div>

      {/* Rendered off-screen, at full 1080×1920 — the actual export target. */}
      <div className="pointer-events-none fixed left-[-9999px] top-0" aria-hidden="true">
        <ShareCard data={data} forwardedRef={cardRef} />
      </div>
    </div>
  );
}
