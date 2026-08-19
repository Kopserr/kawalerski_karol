"use client";

import { motion } from "motion/react";
import { Camera } from "lucide-react";
import { useDeviceTilt } from "@/lib/hooks/useDeviceTilt";
import type { GalleryItem } from "@/lib/data/wrapped";

/** Slide 4 (BRIEF §5.5) — masonry gallery of every proof, with a device-tilt
 * parallax between the two columns (drei carousel would cost far more for
 * the same "look, we did it all" payoff on a phone). */
export function GallerySlide({ gallery }: { gallery: GalleryItem[] }) {
  const tilt = useDeviceTilt();
  const colA = gallery.filter((_, i) => i % 2 === 0);
  const colB = gallery.filter((_, i) => i % 2 === 1);

  if (gallery.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Camera className="size-8 text-fog" />
        <p className="text-sm text-fog">Brak zapisanych dowodów.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 px-4 pt-16">
      <h2 className="text-center font-heading text-2xl uppercase tracking-wide text-fog">
        Galeria dowodów
      </h2>
      <div className="flex flex-1 gap-2.5 overflow-hidden">
        <div
          className="flex flex-1 flex-col gap-2.5"
          style={{ transform: `translateY(${tilt.rx * 3}px)` }}
        >
          {colA.map((item, i) => (
            <GalleryTile key={item.tileId + item.createdAt} item={item} delay={i * 0.05} />
          ))}
        </div>
        <div
          className="flex flex-1 flex-col gap-2.5 pt-8"
          style={{ transform: `translateY(${-tilt.rx * 3}px)` }}
        >
          {colB.map((item, i) => (
            <GalleryTile key={item.tileId + item.createdAt} item={item} delay={i * 0.05 + 0.03} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GalleryTile({ item, delay }: { item: GalleryItem; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-white/10"
    >
      {item.mediaType === "video" ? (
        <video src={item.mediaUrl} muted className="w-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.mediaUrl} alt={item.tileTitle} className="w-full object-cover" loading="lazy" />
      )}
    </motion.div>
  );
}
