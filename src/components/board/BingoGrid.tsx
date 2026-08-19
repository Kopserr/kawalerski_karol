"use client";

import { motion } from "motion/react";
import { Tile } from "@/components/board/Tile";
import { useDeviceTilt } from "@/lib/hooks/useDeviceTilt";
import type { Tile as TileT, TileState } from "@/lib/types";

interface BingoGridProps {
  tiles: TileT[];
  tileStates: Record<number, TileState>;
  interactive?: boolean;
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function BingoGrid({ tiles, tileStates, interactive = true }: BingoGridProps) {
  const tilt = useDeviceTilt();
  const byPosition = [...tiles].sort((a, b) => a.position - b.position);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-4 gap-2.5"
    >
      {byPosition.map((tile) => (
        <motion.div key={tile.id} variants={item}>
          <Tile
            tile={tile}
            tileState={tileStates[tile.id]}
            tilt={tilt}
            interactive={interactive}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
