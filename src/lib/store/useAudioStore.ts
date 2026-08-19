"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AudioStore {
  soundOn: boolean;
  toggle: () => void;
}

/** Global sound preference — gates TTS autoplay and SFX (BRIEF §5.3). */
export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      soundOn: true,
      toggle: () => set((s) => ({ soundOn: !s.soundOn })),
    }),
    { name: "lfd-audio-pref" },
  ),
);
