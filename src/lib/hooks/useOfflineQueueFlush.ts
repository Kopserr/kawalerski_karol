"use client";

import { useEffect, useRef } from "react";
import { flushUploadQueue, listPendingUploads } from "@/lib/offline/uploadQueue";
import { useGameStore } from "@/lib/store/useGameStore";
import { sfx } from "@/lib/audio/sfx";

/** Auto-retries every queued proof upload as soon as the connection comes
 * back (BRIEF §11). Mount once near the app root — cheap when the queue is
 * empty, which is the common case. */
export function useOfflineQueueFlush() {
  const flushing = useRef(false);

  useEffect(() => {
    async function tryFlush() {
      if (flushing.current) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      const pending = await listPendingUploads();
      if (pending.length === 0) return;

      flushing.current = true;
      const submitProof = useGameStore.getState().submitProof;
      const flushed = await flushUploadQueue((tileId, file) => submitProof(tileId, file));
      flushing.current = false;
      if (flushed > 0) sfx.chime();
    }

    void tryFlush();
    window.addEventListener("online", tryFlush);
    return () => window.removeEventListener("online", tryFlush);
  }, []);
}
