"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { sfx } from "@/lib/audio/sfx";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const ParticleBurst = dynamic(() => import("@/components/three/ParticleBurst"), {
  ssr: false,
});

interface RevealAnimationProps {
  children: ReactNode;
  categoryLabel: string;
}

const FLIP_MS = 680;
const MIDPOINT_MS = FLIP_MS / 2;

/**
 * The card flips 180° on Y, and right at the midpoint — edge-on, front face
 * gone — it "dissolves" into a gold particle burst (drei <Points>) before
 * settling back with the task content on the back face (BRIEF §5.3). Under
 * prefers-reduced-motion, content just appears — no flip, no burst.
 */
export function RevealAnimation({ children, categoryLabel }: RevealAnimationProps) {
  const [done, setDone] = useState(false);
  const [burst, setBurst] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setDone(true);
      return;
    }
    sfx.whoosh();
    const t = setTimeout(() => {
      setDone(true);
      setBurst(true);
    }, MIDPOINT_MS);
    return () => clearTimeout(t);
  }, [reducedMotion]);

  if (reducedMotion) {
    return <div className="relative">{done && children}</div>;
  }

  return (
    <div className="relative [perspective:1400px]">
      {burst && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <Suspense fallback={null}>
            <ParticleBurst color="#FFC24B" count={70} durationMs={550} onDone={() => setBurst(false)} />
          </Suspense>
        </div>
      )}

      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 180 }}
        transition={{ duration: FLIP_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
        className="relative [transform-style:preserve-3d]"
      >
        {/* front — closed face */}
        <div className="glass flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-3xl [backface-visibility:hidden]">
          <span className="animate-pulse-glow flex size-16 items-center justify-center rounded-full border border-cyan/40 font-heading text-xs text-cyan">
            {categoryLabel}
          </span>
          <p className="text-xs uppercase tracking-[0.3em] text-fog">
            Odkrywanie zadania…
          </p>
        </div>

        {/* back — revealed content */}
        <div
          className="absolute inset-0 [backface-visibility:hidden]"
          style={{ transform: "rotateY(180deg)" }}
        >
          {done && children}
        </div>
      </motion.div>
    </div>
  );
}
