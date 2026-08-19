"use client";

import { useEffect, useState } from "react";
import { motion, animate } from "motion/react";

function CountUp({ to, delay = 0 }: { to: number; delay?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, to, {
      duration: 0.9,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [to, delay]);

  return <>{value}</>;
}

/** Slide 2 (BRIEF §5.5): "16 ZADAŃ. 2 ARENY. 0 ODWROTU." — counters animated from 0. */
export function CounterSlide() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <p className="heading-hero font-heading text-off-white">
          <span className="text-cyan text-glow-cyan">
            <CountUp to={16} />
          </span>{" "}
          ZADAŃ.
        </p>
        <p className="heading-hero font-heading text-off-white">
          <span className="text-magenta">
            <CountUp to={2} delay={0.3} />
          </span>{" "}
          ARENY.
        </p>
        <p className="heading-hero font-heading text-gold text-glow-gold">
          <CountUp to={0} delay={0.6} /> ODWROTU.
        </p>
      </motion.div>
    </div>
  );
}
