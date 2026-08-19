"use client";

import { motion, AnimatePresence } from "motion/react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { useOfflineQueueFlush } from "@/lib/hooks/useOfflineQueueFlush";

/** BRIEF §11: "plansza pokazuje ostatni znany stan... i kolejkuje uploady
 * do wysyłki po powrocie sieci." This is the visible half of that promise —
 * the queueing itself lives in lib/offline/uploadQueue.ts. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  useOfflineQueueFlush();

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="safe-top fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-blood/90 px-4 py-2 text-center text-xs font-semibold text-off-white"
        >
          <WifiOff className="size-3.5" />
          Brak internetu — dowody wyślą się same, gdy zasięg wróci.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
