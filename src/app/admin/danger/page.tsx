"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { HoldToConfirmButton } from "@/components/admin/HoldToConfirmButton";
import { restartGameAction, type ResetMode } from "@/lib/actions/admin-game";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/utils/haptics";

export default function AdminDangerPage() {
  const router = useRouter();
  const [mode, setMode] = useState<ResetMode>("soft");
  const [code, setCode] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canArm = code.trim().length > 0 && understood;

  async function handleConfirm() {
    setError(null);
    const res = await restartGameAction(mode, code);
    if (res.ok) {
      haptics.success();
      setDone(true);
      setTimeout(() => router.push("/admin/dashboard"), 1500);
    } else {
      haptics.error();
      setError(res.error);
    }
  }

  return (
    <main
      className="relative mx-auto flex min-h-dvh w-full max-w-[560px] flex-col bg-void px-4 py-6 safe-x safe-bottom safe-top"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, rgba(255,71,87,0.06) 0 18px, transparent 18px 36px)",
      }}
    >
      <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm text-fog">
        <ArrowLeft className="size-4" /> Wróć do dashboardu
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 flex flex-col items-center gap-2 text-center"
      >
        <div className="flex size-14 items-center justify-center rounded-full border-2 border-blood bg-blood/10">
          <AlertTriangle className="size-7 text-blood" />
        </div>
        <h1 className="font-heading text-2xl text-blood">STREFA NIEBEZPIECZNA</h1>
        <p className="text-sm text-fog">
          Restart gry. Wszystkie zaliczone kafelki, dowody i wyniki aren
          wracają do zera. Zadania i wgrane zdjęcia twarzy zostają.
        </p>
      </motion.div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode("soft")}
            className={cn(
              "h-14 rounded-2xl border text-sm font-semibold",
              mode === "soft" ? "border-cyan bg-cyan/10 text-cyan" : "border-white/10 text-fog",
            )}
          >
            SOFT RESET
            <br />
            <span className="text-[10px] font-normal">tylko stany kafelków</span>
          </button>
          <button
            onClick={() => setMode("hard")}
            className={cn(
              "h-14 rounded-2xl border text-sm font-semibold",
              mode === "hard" ? "border-blood bg-blood/10 text-blood" : "border-white/10 text-fog",
            )}
          >
            HARD RESET
            <br />
            <span className="text-[10px] font-normal">+ usuwa zdjęcia dowodowe</span>
          </button>
        </div>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          placeholder="KOD RESTARTU (6 CYFR)"
          className="h-14 rounded-2xl border border-blood/30 bg-blood/5 px-4 text-center font-heading text-lg tracking-[0.3em] text-blood placeholder:text-blood/40 focus:border-blood focus:outline-none"
        />

        <label className="flex items-center gap-2.5 text-sm text-off-white">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="size-5 accent-blood"
          />
          Rozumiem, że to nieodwracalne.
        </label>

        {error && <p className="text-center text-sm text-blood">{error}</p>}
        {done && <p className="text-center text-sm text-mint">Zresetowano. Wracam do dashboardu…</p>}

        <HoldToConfirmButton
          label="TRZYMAJ 3s, ŻEBY ZRESETOWAĆ"
          disabled={!canArm || done}
          onConfirm={handleConfirm}
        />
      </div>
    </main>
  );
}
