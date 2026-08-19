import { mulberry32 } from "@/lib/utils/rng";

/** Deterministic fallback avatar (emoji + gradient) for a given seed string
 * — no uploads required (BRIEF §7.2: "gra musi być grywalna zanim ktokolwiek
 * cokolwiek wgra"). Deliberately neutral emoji (no hearts/rings) so a
 * fallback avatar never itself hints which card is the fiancée's. */
const EMOJI = ["🙂", "😎", "🧑", "🧔", "👩", "🕺", "💃", "🧑‍🦱", "👱", "🧑‍🦰", "🤠", "🥸"];
const GRADIENTS: [string, string][] = [
  ["#22E4FF", "#7B5BFF"],
  ["#FF2D9B", "#FF6B35"],
  ["#FFC24B", "#FF8A3D"],
  ["#3BF5A0", "#22E4FF"],
  ["#7B5BFF", "#FF2D9B"],
];

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0;
  return h >>> 0;
}

export function avatarFor(seed: string): { emoji: string; gradient: [string, string] } {
  const rng = mulberry32(hashSeed(seed));
  const emoji = EMOJI[Math.floor(rng() * EMOJI.length)];
  const gradient = GRADIENTS[Math.floor(rng() * GRADIENTS.length)];
  return { emoji, gradient };
}
