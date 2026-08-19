"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { MapPin, X, CheckCircle2, Clock3, Pause } from "lucide-react";
import { RevealAnimation } from "@/components/task/RevealAnimation";
import { VoicePlayer } from "@/components/task/VoicePlayer";
import { ProofUploader } from "@/components/task/ProofUploader";
import { DifficultyFlames } from "@/components/task/DifficultyFlames";
import { TileCompletionFx } from "@/components/board/TileCompletionFx";
import { CATEGORY_LABEL } from "@/lib/categories";
import { useGameStore, type ServerHydration } from "@/lib/store/useGameStore";
import { useAudioStore } from "@/lib/store/useAudioStore";
import { useServerSync } from "@/lib/hooks/useServerSync";
import { haptics } from "@/lib/utils/haptics";

interface TaskCardProps {
  tileId: number;
  /** "modal": rendered over the still-mounted board via the intercepted
   * route, so the shared layoutId morph plays. "page": full-page fallback
   * for a direct link / refresh — same content, no partner tile to morph from. */
  variant: "modal" | "page";
  initial: ServerHydration | null;
}

export function TaskCard({ tileId, variant, initial }: TaskCardProps) {
  useServerSync(initial);

  const router = useRouter();
  const tile = useGameStore((s) => s.tiles.find((t) => t.id === tileId));
  const tileState = useGameStore((s) => s.tileStates[tileId]);
  const skipsLeft = useGameStore((s) => s.skipsLeft);
  const openTile = useGameStore((s) => s.openTile);
  const submitProof = useGameStore((s) => s.submitProof);
  const skipTile = useGameStore((s) => s.skipTile);
  const devApprove = useGameStore((s) => s.devApprove);
  const devReject = useGameStore((s) => s.devReject);
  const soundOn = useAudioStore((s) => s.soundOn);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const paused = gameStatus === "paused";
  const [showCompletionFx, setShowCompletionFx] = useState(false);
  const [prevState, setPrevState] = useState(tileState?.state);

  useEffect(() => {
    if (tileState?.state === "locked" && !paused) void openTile(tileId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevState !== "done" && tileState?.state === "done") {
      setShowCompletionFx(true);
    }
    setPrevState(tileState?.state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileState?.state]);

  function close() {
    haptics.tap();
    router.back();
  }

  if (!tile || !tileState) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-void">
        <p className="text-fog">Nie znaleziono zadania.</p>
      </div>
    );
  }

  if (paused) {
    return (
      <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-void px-6 text-center safe-top safe-bottom safe-x">
        <div className="flex size-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
          <Pause className="size-7 text-gold" />
        </div>
        <h1 className="font-heading text-3xl text-gold">PRZERWA</h1>
        <p className="max-w-xs text-sm text-fog">
          Ekipa wstrzymała grę. To zadanie poczeka.
        </p>
        <button
          onClick={close}
          className="mt-2 flex h-12 items-center justify-center rounded-2xl border border-white/10 px-6 text-sm text-off-white"
        >
          Wróć do planszy
        </button>
      </div>
    );
  }

  return (
    <motion.div
      layoutId={variant === "modal" ? `tile-${tile.id}` : undefined}
      initial={variant === "page" ? { opacity: 0 } : undefined}
      animate={variant === "page" ? { opacity: 1 } : undefined}
      exit={variant === "page" ? { opacity: 0 } : undefined}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-30 flex flex-col overflow-y-auto bg-abyss safe-top safe-bottom safe-x"
    >
      {showCompletionFx && (
        <TileCompletionFx onDone={() => setShowCompletionFx(false)} />
      )}

      <header className="sticky top-0 z-10 flex items-center justify-between bg-abyss/80 px-4 py-3 backdrop-blur-md">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-fog">
          Zadanie {String(tile.id).padStart(2, "0")}
        </span>
        <button
          onClick={close}
          aria-label="Zamknij"
          className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="flex-1 px-4 pb-6">
        <RevealAnimation categoryLabel={CATEGORY_LABEL[tile.category]}>
          <div className="flex min-h-[50vh] flex-col gap-5 rounded-3xl bg-abyss p-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan">
                {CATEGORY_LABEL[tile.category]}
              </span>
              <DifficultyFlames level={tile.difficulty} />
            </div>

            <h1 className="font-heading text-4xl leading-[0.95] text-off-white">
              {tile.title}
            </h1>

            <p className="text-base leading-relaxed text-fog">{tile.description}</p>

            {tile.location && (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-off-white">
                <MapPin className="size-4 text-magenta" /> {tile.location}
              </span>
            )}

            <VoicePlayer
              text={`${tile.title}. ${tile.description}`}
              voiceoverUrl={tile.voiceoverUrl}
              autoPlay={soundOn}
            />
          </div>
        </RevealAnimation>

        <div className="mt-6">
          {tileState.state === "active" && (
            <ProofUploader
              skipsLeft={skipsLeft}
              onSubmit={(file) => submitProof(tile.id, file)}
              onSkip={() => skipTile(tile.id)}
            />
          )}

          {tileState.state === "pending" && (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-gold/30 bg-gold/5 p-6 text-center">
              <Clock3 className="size-8 animate-pulse text-gold" />
              <p className="font-heading text-lg text-gold">
                Czekamy na werdykt…
              </p>
              <p className="text-sm text-fog">
                Dowód wysłany. Admin zatwierdzi go z panelu, a kafelek zapali
                się sam.
              </p>

              {/* Temporary stand-in for /admin/dashboard approval, phase 3. */}
              <details className="mt-2 w-full text-left">
                <summary className="cursor-pointer text-xs text-fog/60">
                  dev: symuluj admina
                </summary>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => devApprove(tile.id)}
                    className="flex-1 rounded-xl bg-mint/15 py-2 text-xs font-semibold uppercase tracking-wide text-mint"
                  >
                    Zatwierdź
                  </button>
                  <button
                    onClick={() => devReject(tile.id, "Spróbuj wyraźniejsze zdjęcie.")}
                    className="flex-1 rounded-xl bg-blood/15 py-2 text-xs font-semibold uppercase tracking-wide text-blood"
                  >
                    Odrzuć
                  </button>
                </div>
              </details>
            </div>
          )}

          {tileState.state === "rejected" && (
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-blood/40 bg-blood/10 p-6 text-center">
              <p className="font-heading text-lg text-blood">Odrzucone</p>
              <p className="text-sm text-fog">{tileState.rejectReason}</p>
              <p className="text-xs text-fog/60">Wracasz do zadania…</p>
            </div>
          )}

          {tileState.state === "done" && (
            <div className="flex flex-col items-center gap-3 rounded-3xl p-6 text-center" style={{ background: "var(--grad-gold)" }}>
              <CheckCircle2 className="size-10 text-void" />
              <p className="font-heading text-xl text-void">Zaliczone</p>
              {tileState.proofUrl && (
                <div className="mt-2 w-full overflow-hidden rounded-2xl">
                  {tileState.proofType === "video" ? (
                    <video src={tileState.proofUrl} controls className="w-full" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tileState.proofUrl} alt="Dowód" className="w-full object-cover" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
