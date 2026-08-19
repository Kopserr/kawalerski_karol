"use client";

import { AnimatePresence } from "motion/react";

/**
 * Wraps the @modal parallel-route slot in AnimatePresence. Without this,
 * Next.js unmounts TaskCard the instant the route changes (back button,
 * close button) with zero animation frames — which also cuts off Framer
 * Motion's shared layoutId handoff back to the grid tile mid-flight and
 * leaves it stuck (BRIEF §4.3's "kafelek ma dosłownie rozwijać się" has to
 * hold in both directions). AnimatePresence gives the exiting tree one more
 * frame to resolve that handoff before it's actually removed.
 */
export function ModalSlot({ children }: { children: React.ReactNode }) {
  return <AnimatePresence>{children}</AnimatePresence>;
}
