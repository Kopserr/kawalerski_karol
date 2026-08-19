"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoicePlayerProps {
  text: string;
  voiceoverUrl?: string | null;
  autoPlay?: boolean;
}

/**
 * Two-tier TTS per BRIEF §9: plays a pre-generated `voiceover_url` if one
 * exists, otherwise falls back to the free, always-available Web Speech API
 * with a pl-PL voice.
 */
export function VoicePlayer({ text, voiceoverUrl, autoPlay }: VoicePlayerProps) {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAutoplay = useRef(false);

  function speakWithWebSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pl-PL";
    utter.rate = 1;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith("pl"));
    if (voice) utter.voice = voice;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }

  function play() {
    if (voiceoverUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
      setSpeaking(true);
      return;
    }
    speakWithWebSpeech();
  }

  function stop() {
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    setSpeaking(false);
  }

  useEffect(() => {
    if (autoPlay && !startedAutoplay.current) {
      startedAutoplay.current = true;
      play();
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-3">
      {voiceoverUrl && (
        <audio
          ref={audioRef}
          src={voiceoverUrl}
          onEnded={() => setSpeaking(false)}
        />
      )}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={speaking ? stop : play}
        aria-label={speaking ? "Zatrzymaj lektora" : "Odtwórz lektora"}
        className={cn(
          "flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]",
          speaking && "border-cyan/60 text-cyan glow-cyan",
        )}
      >
        {speaking ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </motion.button>
      <div className="flex h-6 items-end gap-0.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.span
            key={i}
            className="w-0.5 rounded-full bg-cyan"
            animate={
              speaking
                ? { height: [4, 4 + ((i * 7) % 18), 4] }
                : { height: 3 }
            }
            transition={
              speaking
                ? {
                    duration: 0.5 + (i % 4) * 0.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                : undefined
            }
            style={{ opacity: speaking ? 0.9 : 0.25 }}
          />
        ))}
      </div>
    </div>
  );
}
