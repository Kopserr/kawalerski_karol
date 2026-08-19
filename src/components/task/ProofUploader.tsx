"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Camera, SkipForward, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/utils/haptics";

interface ProofUploaderProps {
  onSubmit: (file: File) => Promise<{ ok: boolean; error?: string }>;
  onSkip: () => void;
  skipsLeft: number;
}

export function ProofUploader({ onSubmit, onSkip, skipsLeft }: ProofUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ file: File; url: string; type: "image" | "video" } | null>(
    null,
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    setPreview({ file, url, type });
    setError(null);
    haptics.tap();
  }

  async function handleSend() {
    if (!preview) return;
    setSending(true);
    setError(null);
    const result = await onSubmit(preview.file);
    setSending(false);
    if (result.ok) {
      haptics.success();
    } else {
      haptics.error();
      setError(result.error ?? "Nie udało się wysłać. Spróbuj jeszcze raz.");
    }
  }

  if (preview) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/10">
          {preview.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt="Podgląd dowodu" className="max-h-64 w-full object-cover" />
          ) : (
            <video src={preview.url} controls className="max-h-64 w-full" />
          )}
          {!sending && (
            <button
              onClick={() => setPreview(null)}
              aria-label="Usuń podgląd"
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-void/70 text-off-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {error && <p className="text-center text-sm text-blood">{error}</p>}
        <Button
          onClick={handleSend}
          disabled={sending}
          className="h-14 gap-2 rounded-2xl font-heading text-base tracking-wide disabled:opacity-60"
          style={{ background: "var(--grad-hot)", color: "var(--color-off-white)" }}
        >
          {sending ? (
            <>
              <Loader2 className="size-5 animate-spin" /> WYSYŁANIE…
            </>
          ) : (
            <>
              <Send className="size-5" /> WYŚLIJ DO ZATWIERDZENIA
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => inputRef.current?.click()}
        className="glow-magenta flex h-14 items-center justify-center gap-2 rounded-2xl font-heading text-base tracking-wide text-off-white"
        style={{ background: "var(--grad-hot)" }}
      >
        <Camera className="size-5" /> WRZUĆ DOWÓD
      </motion.button>
      <button
        onClick={() => {
          if (skipsLeft <= 0) return;
          haptics.tap();
          onSkip();
        }}
        disabled={skipsLeft <= 0}
        className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 text-sm text-fog disabled:opacity-30"
      >
        <SkipForward className="size-4" /> POMIŃ ({skipsLeft} zostały)
      </button>
    </div>
  );
}
