"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sfx } from "@/lib/audio/sfx";
import type { Database } from "@/lib/supabase/database.types";

type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];

/** New-proof alert for the dashboard (BRIEF §8.1: "Nie może ci umknąć") —
 * a chime plus a callback to bump a badge. Full Web Push (background
 * notifications while the tab is closed) needs a service worker + VAPID
 * keys and is deferred past this phase; this covers "the dashboard is open
 * on the admin's phone", which is the actual expected setup during the day. */
export function useAdminRealtime(onNewSubmission: (row: SubmissionRow) => void) {
  const callback = useRef(onNewSubmission);
  callback.current = onNewSubmission;

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();

    const channel = supabase
      .channel("admin-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        (payload) => {
          const row = payload.new as SubmissionRow;
          if (row.status !== "pending") return;
          sfx.chime();
          callback.current(row);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
}
