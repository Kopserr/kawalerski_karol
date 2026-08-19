"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { togglePauseAction } from "@/lib/actions/admin-game";
import { haptics } from "@/lib/utils/haptics";
import { cn } from "@/lib/utils";

export function PauseToggle({
  paused,
  onToggled,
}: {
  paused: boolean;
  onToggled: (paused: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await togglePauseAction();
    if (res.ok) {
      haptics.tap();
      onToggled(!paused);
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={cn(
        "flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-heading text-base tracking-wide disabled:opacity-50",
        paused ? "bg-gold/15 text-gold" : "border border-white/10 bg-white/[0.03] text-off-white",
      )}
    >
      {paused ? (
        <>
          <Play className="size-5" /> WZNÓW GRĘ
        </>
      ) : (
        <>
          <Pause className="size-5" /> PAUZA GRY
        </>
      )}
    </button>
  );
}
