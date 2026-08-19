"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "motion/react";
import { KeyRound } from "lucide-react";
import { GradientMesh } from "@/components/fx/GradientMesh";
import { GlowCard } from "@/components/fx/GlowCard";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store/useGameStore";
import { verifyGroomCodeAction } from "@/lib/actions/auth";
import { haptics } from "@/lib/utils/haptics";

const schema = z.object({
  code: z.string().min(1, "Podaj kod dostępu"),
});
type FormValues = z.infer<typeof schema>;

export default function GatePage() {
  const router = useRouter();
  const setGroomAuthed = useGameStore((s) => s.setGroomAuthed);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    // Checked server-side against game_state.access_code, which RLS hides
    // from anon entirely (BRIEF §10) — the code never round-trips as
    // client-readable data either way.
    const ok = await verifyGroomCodeAction(values.code);
    if (ok) {
      setGroomAuthed(true);
      haptics.success();
      router.push("/board");
    } else {
      haptics.error();
      setError("Zły kod. Spróbuj jeszcze raz.");
    }
  }

  return (
    <main className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-void px-6 safe-x safe-top safe-bottom">
      <GradientMesh />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <GlowCard className="p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="glow-cyan flex size-12 items-center justify-center rounded-full bg-cyan/10">
              <KeyRound className="size-6 text-cyan" />
            </div>
            <h1 className="font-heading text-2xl">Wejście dla Pana Młodego</h1>
            <p className="text-sm text-fog">
              Wpisz jednorazowy kod dostępu, żeby zacząć grę.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-3">
            <input
              {...register("code")}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="KOD DOSTĘPU"
              className="h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-center font-heading text-xl tracking-[0.3em] text-off-white uppercase placeholder:text-fog/50 focus:border-cyan focus:outline-none"
            />
            {(errors.code || error) && (
              <p className="text-center text-sm text-blood">
                {errors.code?.message ?? error}
              </p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-14 rounded-2xl font-heading text-base tracking-wide"
              style={{ background: "var(--grad-cool)", color: "var(--color-void)" }}
            >
              WCHODZĘ
            </Button>
          </form>
        </GlowCard>

        <p className="mt-4 text-center text-xs text-fog">
          Jesteś znajomym? Oglądaj na żywo na{" "}
          <a href="/live" className="text-cyan underline underline-offset-2">
            /live
          </a>
          , bez kodu.
        </p>
      </motion.div>
    </main>
  );
}
