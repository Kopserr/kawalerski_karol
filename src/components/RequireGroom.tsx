"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store/useGameStore";

/** Gate for GROOM-only routes. No accounts, no roles — just the one-time
 * access code from BRIEF §2, remembered in localStorage. */
export function RequireGroom({ children }: { children: React.ReactNode }) {
  const hasHydrated = useGameStore((s) => s.hasHydrated);
  const groomAuthed = useGameStore((s) => s.groomAuthed);
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && !groomAuthed) {
      router.replace("/gate");
    }
  }, [hasHydrated, groomAuthed, router]);

  if (!hasHydrated || !groomAuthed) {
    return (
      <div className="flex h-dvh items-center justify-center bg-void">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan/30 border-t-cyan" />
      </div>
    );
  }

  return <>{children}</>;
}
