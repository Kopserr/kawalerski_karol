"use client";

import { useEffect, useRef } from "react";
import { useGameStore, type ServerHydration } from "@/lib/store/useGameStore";
import { useRealtimeGame } from "@/lib/hooks/useRealtimeGame";

/** One-time hydration from a Server Component's `getBoardData()` result,
 * plus the Realtime subscription that keeps the store live afterwards.
 * `data` is null when Supabase isn't configured — the store just keeps
 * its Phase-1 local-mode defaults. */
export function useServerSync(data: ServerHydration | null) {
  const hydrateFromServer = useGameStore((s) => s.hydrateFromServer);
  const hydrated = useRef(false);

  useEffect(() => {
    if (data && !hydrated.current) {
      hydrated.current = true;
      hydrateFromServer(data);
    }
  }, [data, hydrateFromServer]);

  useRealtimeGame();
}
