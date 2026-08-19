import { motion } from "motion/react";
import { GradientMesh } from "@/components/fx/GradientMesh";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.2 } },
};
const letter = {
  hidden: { opacity: 0, y: 40, rotateX: -60 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function AnimatedLine({ text }: { text: string }) {
  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="show"
      className="inline-block [perspective:600px]"
    >
      {text.split("").map((ch, i) => (
        <motion.span key={i} variants={letter} className="inline-block">
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </motion.span>
  );
}

/** Slide 1 (BRIEF §5.5): "MALTA. [DATA]." — text driving in letter by letter. */
export function TitleSlide({ eventDateLabel }: { eventDateLabel: string }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center">
      <GradientMesh />
      <div className="relative z-10">
        <h1 className="heading-hero text-glow-cyan font-heading">
          <AnimatedLine text="MALTA." />
        </h1>
        <h2 className="heading-hero font-heading text-gold text-glow-gold mt-1">
          <AnimatedLine text={eventDateLabel.toUpperCase() + "."} />
        </h2>
      </div>
    </div>
  );
}
