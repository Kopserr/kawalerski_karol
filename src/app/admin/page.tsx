"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import { GradientMesh } from "@/components/fx/GradientMesh";
import { GlowCard } from "@/components/fx/GlowCard";
import { Button } from "@/components/ui/button";
import { signInAction } from "@/lib/actions/admin-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const schema = z.object({
  email: z.string().email("Podaj poprawny e-mail"),
  password: z.string().min(1, "Podaj hasło"),
});
type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const result = await signInAction(values.email, values.password);
    if (result.ok) {
      router.push("/admin/dashboard");
      router.refresh();
    } else {
      setError(result.error);
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
            <div className="glow-magenta flex size-12 items-center justify-center rounded-full bg-magenta/10">
              <ShieldCheck className="size-6 text-magenta" />
            </div>
            <h1 className="font-heading text-2xl">Panel admina</h1>
            <p className="text-sm text-fog">
              Logowanie dla organizatora — zatwierdzanie dowodów i edycja gry.
            </p>
          </div>

          {!isSupabaseConfigured() ? (
            <p className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-4 text-center text-sm text-gold">
              Supabase nie jest jeszcze skonfigurowany (brak zmiennych
              środowiskowych). Panel admina będzie działał po podłączeniu
              projektu — patrz README.
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-3">
              <input
                {...register("email")}
                type="email"
                autoFocus
                autoComplete="username"
                placeholder="E-MAIL"
                className="h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-center font-heading text-base tracking-wide text-off-white placeholder:text-fog/50 focus:border-magenta focus:outline-none"
              />
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                placeholder="HASŁO"
                className="h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-center font-heading text-base tracking-wide text-off-white placeholder:text-fog/50 focus:border-magenta focus:outline-none"
              />
              {(errors.email || errors.password || error) && (
                <p className="text-center text-sm text-blood">
                  {errors.email?.message ?? errors.password?.message ?? error}
                </p>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-14 rounded-2xl font-heading text-base tracking-wide"
                style={{ background: "var(--grad-hot)", color: "var(--color-off-white)" }}
              >
                ZALOGUJ
              </Button>
            </form>
          )}
        </GlowCard>
      </motion.div>
    </main>
  );
}
