"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Pencil, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { manualCompleteTileAction, manualRevertTileAction } from "@/lib/actions/admin-tiles";
import { haptics } from "@/lib/utils/haptics";
import type { Tile, TileState } from "@/lib/types";

const STATE_COLOR: Record<TileState["state"], string> = {
  locked: "bg-white/[0.03] text-fog border-white/10",
  active: "bg-cyan/10 text-cyan border-cyan/40",
  pending: "bg-gold/10 text-gold border-gold/40",
  done: "bg-mint/15 text-mint border-mint/40",
  rejected: "bg-blood/10 text-blood border-blood/40",
};

interface TileGridAdminProps {
  tiles: Tile[];
  tileStates: Record<number, TileState>;
  onChanged: (tileId: number, patch: Partial<TileState>) => void;
}

export function TileGridAdmin({ tiles, tileStates, onChanged }: TileGridAdminProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const byPosition = [...tiles].sort((a, b) => a.position - b.position);
  const selectedTile = tiles.find((t) => t.id === selected);

  async function complete(id: number) {
    setBusy(true);
    const res = await manualCompleteTileAction(id);
    if (res.ok) {
      haptics.success();
      onChanged(id, { state: "done", completedAt: new Date().toISOString() });
    }
    setBusy(false);
  }

  async function revert(id: number) {
    setBusy(true);
    const res = await manualRevertTileAction(id);
    if (res.ok) {
      haptics.tap();
      onChanged(id, { state: "locked", openedAt: undefined, completedAt: undefined, rejectReason: undefined });
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {byPosition.map((tile) => {
          const state = tileStates[tile.id]?.state ?? "locked";
          return (
            <motion.button
              key={tile.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                haptics.tap();
                setSelected(tile.id === selected ? null : tile.id);
              }}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-xl border font-heading text-sm",
                STATE_COLOR[state],
                selected === tile.id && "ring-2 ring-cyan",
              )}
            >
              {String(tile.id).padStart(2, "0")}
            </motion.button>
          );
        })}
      </div>

      {selectedTile && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3"
        >
          <p className="mb-2 font-heading text-sm">
            {String(selectedTile.id).padStart(2, "0")} · {selectedTile.title}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => complete(selectedTile.id)}
              disabled={busy}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-mint/15 text-xs font-semibold text-mint disabled:opacity-40"
            >
              <CheckCircle2 className="size-4" /> ZALICZ
            </button>
            <button
              onClick={() => revert(selectedTile.id)}
              disabled={busy}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-white/10 text-xs font-semibold text-off-white disabled:opacity-40"
            >
              <RotateCcw className="size-4" /> COFNIJ
            </button>
            <Link
              href={`/admin/tile/${selectedTile.id}`}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/10 text-xs font-semibold text-fog"
            >
              <Pencil className="size-4" /> EDYTUJ
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
