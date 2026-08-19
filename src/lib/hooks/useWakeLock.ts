"use client";

import { useEffect } from "react";

/** Keeps the screen on during a minigame (BRIEF §11). Silently does
 * nothing on browsers without the Wake Lock API — never a hard requirement
 * to play. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    async function acquire() {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        // ignore — e.g. tab not visible, or unsupported
      }
    }
    void acquire();

    function onVisibility() {
      if (document.visibilityState === "visible" && !sentinel && !cancelled) void acquire();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel?.release();
    };
  }, [active]);
}
