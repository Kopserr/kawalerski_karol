"use client";

import { motion } from "motion/react";
import { CATEGORY_LABEL } from "@/lib/categories";
import type { GalleryItem } from "@/lib/data/wrapped";
import type { Tile } from "@/lib/types";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

/** Slide 5 (BRIEF §5.5) — vertical timeline of the day, photo per completed challenge. */
export function TimelineSlide({ gallery, tiles }: { gallery: GalleryItem[]; tiles: Tile[] }) {
  return (
    <div className="flex h-full flex-col px-5 pt-16">
      <h2 className="mb-4 text-center font-heading text-2xl uppercase tracking-wide text-fog">
        Oś czasu
      </h2>
      <div className="flex-1 overflow-y-auto pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="relative ml-4 flex flex-col gap-5 border-l-2 border-white/10 pl-6">
          {gallery.map((item, i) => {
            const tile = tiles.find((t) => t.id === item.tileId);
            return (
              <motion.div
                key={item.tileId + item.createdAt}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="relative"
              >
                <span
                  className="absolute -left-[31px] top-1 size-3 rounded-full"
                  style={{ background: "var(--grad-gold)" }}
                />
                <p className="text-xs text-fog">{formatTime(item.createdAt)}</p>
                <div className="glass mt-1 flex items-center gap-3 rounded-2xl p-2">
                  {item.mediaType === "video" ? (
                    <video src={item.mediaUrl} muted className="size-16 shrink-0 rounded-xl object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.mediaUrl}
                      alt={item.tileTitle}
                      className="size-16 shrink-0 rounded-xl object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm text-off-white">{item.tileTitle}</p>
                    {tile && (
                      <p className="text-[10px] uppercase tracking-wider text-cyan">
                        {CATEGORY_LABEL[tile.category]}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
