"use client";

import confetti from "canvas-confetti";

/** Fire a burst of confetti in brand colors. Respects reduced-motion. */
export function fireConfetti(options?: {
  gold?: boolean;
  particleCount?: number;
  origin?: { x?: number; y?: number };
}) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const colors = options?.gold
    ? ["#FFC24B", "#FF8A3D", "#F2F5FF"]
    : ["#22E4FF", "#FF2D9B", "#FFC24B"];

  confetti({
    particleCount: options?.particleCount ?? 90,
    spread: 80,
    startVelocity: 42,
    gravity: 0.9,
    ticks: 200,
    origin: { x: options?.origin?.x ?? 0.5, y: options?.origin?.y ?? 0.55 },
    colors,
    zIndex: 80,
  });
}

/** The card-shatter moment on a Pokusa mistake — a small, sharp, all-red
 * burst rather than a celebration (BRIEF §7.2: "karta pęka w czerwone
 * cząsteczki"). */
export function fireShatter(origin?: { x?: number; y?: number }) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  confetti({
    particleCount: 40,
    spread: 55,
    startVelocity: 28,
    gravity: 1.4,
    scalar: 0.7,
    ticks: 120,
    origin: { x: origin?.x ?? 0.5, y: origin?.y ?? 0.45 },
    colors: ["#FF4757", "#B00020", "#F2F5FF"],
    zIndex: 80,
  });
}
