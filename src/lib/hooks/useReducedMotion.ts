"use client";

import { useEffect, useState } from "react";

/** BRIEF §1: "Respektuj prefers-reduced-motion – wtedy statyczne wersje
 * efektów." Starts `false` (SSR-safe) and syncs on mount + live changes. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
