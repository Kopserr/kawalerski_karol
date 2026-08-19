"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const WARN_THRESHOLD = 0.34; // prototype's `f < 0.34` → bar goes red + starts ticking
const WARN_TICK_INTERVAL_MS = 400;

interface UseCardTimerOptions {
  cardId: string;
  durationSec: number;
  active: boolean;
  onExpire: () => void;
  /** Throttled pulse while the bar is in its red warn state — drives the
   * tick SFX (prototype: `SFX.tick()` inside `tickTimer()`). */
  onWarnTick?: () => void;
}

/**
 * Drives the decision-timer bar straight through the DOM on every animation
 * frame — never through React state (BRIEF §7.2: "inaczej przerysujesz
 * talię 60×/s"). Restarts whenever `cardId` changes; `active=false` freezes
 * it (used during the mistake/win overlays).
 */
export function useCardTimer({
  cardId,
  durationSec,
  active,
  onExpire,
  onWarnTick,
}: UseCardTimerOptions): RefObject<HTMLDivElement | null> {
  const barRef = useRef<HTMLDivElement | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const onWarnTickRef = useRef(onWarnTick);
  onWarnTickRef.current = onWarnTick;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    let expired = false;
    let lastWarnTick = 0;
    let wasWarn = false;

    function tick(now: number) {
      const elapsed = (now - start) / 1000;
      const remaining = Math.max(0, 1 - elapsed / durationSec);
      const warn = remaining < WARN_THRESHOLD;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${remaining})`;
        barRef.current.style.background = warn ? "var(--color-blood)" : "var(--grad-cool)";
      }
      if (warn && (!wasWarn || now - lastWarnTick > WARN_TICK_INTERVAL_MS)) {
        lastWarnTick = now;
        onWarnTickRef.current?.();
      }
      wasWarn = warn;
      if (remaining <= 0 && !expired) {
        expired = true;
        onExpireRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // restart on a new card or if this card becomes active again
  }, [cardId, durationSec, active]);

  return barRef;
}
