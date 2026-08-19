"use client";

/**
 * Tiny procedural sound effects via the Web Audio API — no binary assets to
 * ship, works fully offline (BRIEF §1, §7). Pre-generated voiceover/music
 * files can be layered in later without touching this module.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freqStart: number,
  freqEnd: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.06,
) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(freqEnd, 1),
    audio.currentTime + duration,
  );
  g.gain.setValueAtTime(gain, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.connect(g).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

export const sfx = {
  whoosh: () => tone(180, 620, 0.45, "sine", 0.05),
  chime: () => {
    tone(660, 880, 0.25, "triangle", 0.05);
    setTimeout(() => tone(880, 1320, 0.3, "triangle", 0.05), 90);
  },
  error: () => tone(220, 110, 0.35, "sawtooth", 0.05),
  tap: () => tone(500, 400, 0.06, "sine", 0.03),
  chlup: () => tone(320, 180, 0.12, "sine", 0.05),
  /** Timer warn-state pulse — prototype's `beep(1400,.03,'square',.025)`. */
  tick: () => tone(1400, 1400, 0.03, "square", 0.025),
};
