import { mulberry32 } from "@/lib/utils/rng";
import type { PokusaCard } from "./types";

/**
 * Ported 1:1 from `pokusa-prototype.html` — pool content, impostor
 * templates and trap probabilities are all taken from there rather than
 * re-derived from the brief's prose, on request (the prototype is the
 * authoritative reference for how this plays).
 */

const DECK_SIZE = 20;
const FIANCEE_COUNT = 3;
const FIANCEE_RANGE: [number, number] = [4, 18]; // 1-indexed, never first/last
const TRAP_BORDER_FROM = 8;
const TRAP_NAME_FROM = 14;
const IMPOSTOR_CHANCE = 0.45; // from card 14+: chance a temptation is an impostor
const BORDER_TRAP_CHANCE = 0.35; // from card 8+: chance a plain temptation still gets her border

interface PoolEntry {
  name: string;
  flav: string;
  seed: string;
}

/** Regular temptations — never bordered before card 8, name never a giveaway. */
const POOL: PoolEntry[] = [
  { name: "BARMANKA Z PACEVILLE", flav: "Nalewa ci już czwartego. Bez pytania.", seed: "barmanka" },
  { name: "TWOJA EX Z LICEUM", flav: "Napisała „słyszałam, że się żenisz”.", seed: "ex" },
  { name: "DZIEWCZYNA Z HOSTELU", flav: "Zapytała, czy znasz dobre miejsce.", seed: "hostel" },
  { name: "TANCERKA", flav: "Wskazała na ciebie. Ekipa krzyczy.", seed: "tancerka" },
  { name: "TURYSTKA Z NIEMIEC", flav: "Chce zdjęcie z widokiem. I z tobą.", seed: "turystka" },
  { name: "KOLEŻANKA Z PRACY", flav: "„Przecież my się tylko przyjaźnimy”.", seed: "kolezanka" },
  { name: "TA CO CI STAWIAŁA SHOTA", flav: "Nie pamiętasz jej imienia. Ona twoje — tak.", seed: "shot" },
  { name: "PROFIL Z TINDERA", flav: "Konto miało zostać usunięte w marcu.", seed: "tinder" },
  { name: "CIOCIA BASIA", flav: "Pyta, kiedy wnuki. O 1 w nocy.", seed: "basia" },
  { name: "PRZYSZŁA TEŚCIOWA", flav: "Widzi wszystko. Zawsze.", seed: "teściowa" },
  { name: "KOLEGA JANUSZ", flav: "Chce ci coś ważnego powiedzieć. Znowu.", seed: "janusz" },
  { name: "RECEPCJONISTKA", flav: "Ma zapasowy klucz. Wspomniała o tym.", seed: "recepcja" },
];

/** From card 14 — impersonate her (name template + always her border
 * color). "{NAME}" is swapped for the real fiancée's name at build time. */
const IMPOSTORS: PoolEntry[] = [
  { name: "SIOSTRA NARZECZONEJ", flav: "Ma jej oczy i jej numer.", seed: "siostra" },
  { name: "{NAME}?", flav: "Zapisana bez nazwiska.", seed: "impostor-1" },
  { name: "{NAME} Z PRACY", flav: "Pisze o dziesiątej wieczorem.", seed: "impostor-2" },
  { name: "JEJ NAJLEPSZA PRZYJACIÓŁKA", flav: "Wszystko jej powtórzy.", seed: "impostor-3" },
];

/** Deliberately as ambiguous as any temptation's flavour text — BRIEF §7.2:
 * "podpisy narzeczonej muszą być tak samo niejednoznaczne". */
const BRIDE_FLAV = [
  "Wie, gdzie jesteś. Mniej więcej.",
  "Poznałeś ją cztery lata temu.",
  "Nie odpisuje od godziny.",
  "Za chwilę zadzwoni.",
];

/** 3 distinct, non-adjacent positions inside FIANCEE_RANGE. */
function pickFianceePositions(rng: () => number): Set<number> {
  const [lo, hi] = FIANCEE_RANGE;
  while (true) {
    const picks = new Set<number>();
    while (picks.size < FIANCEE_COUNT) {
      picks.add(lo + Math.floor(rng() * (hi - lo + 1)));
    }
    const sorted = [...picks].sort((a, b) => a - b);
    const adjacent = sorted.some((v, i) => i > 0 && v - sorted[i - 1] === 1);
    if (!adjacent) return picks;
  }
}

/** Random pick that avoids repeating the immediately preceding card's name
 * (prototype's `pick(arr, avoid)`) — up to 12 tries, then gives up. */
function pick(arr: PoolEntry[], avoid: string | null, rng: () => number): PoolEntry {
  let c = arr[0];
  let guard = 0;
  do {
    c = arr[Math.floor(rng() * arr.length)];
  } while (avoid && c.name === avoid && guard++ < 12);
  return c;
}

export interface DeckOptions {
  brideName: string | null;
  bridePhoto: string | null;
  seed?: number;
}

/**
 * Pregenerates the full 20-card deck before the round starts (BRIEF §7.2 —
 * "deterministyczna kolejność w jednym podejściu"). A new attempt calls
 * this again with a fresh seed, so the order varies between tries without
 * ever changing mid-attempt.
 */
export function buildDeck({ brideName, bridePhoto, seed = Date.now() }: DeckOptions): PokusaCard[] {
  const rng = mulberry32(seed);
  const name = brideName?.trim() || "NARZECZONA";
  const fianceePositions = pickFianceePositions(rng);
  const deck: PokusaCard[] = [];
  let prev: string | null = null;

  for (let position = 1; position <= DECK_SIZE; position++) {
    if (fianceePositions.has(position)) {
      deck.push({
        id: `card-${position}`,
        kind: "fiancee",
        label: name,
        flav: BRIDE_FLAV[Math.floor(rng() * BRIDE_FLAV.length)],
        photoUrl: bridePhoto,
        avatarSeed: "bride",
        sameBorderTrap: false,
      });
      prev = name;
      continue;
    }

    let src: PoolEntry;
    let bordered = false;
    if (position >= TRAP_NAME_FROM && rng() < IMPOSTOR_CHANCE) {
      src = pick(IMPOSTORS, prev, rng);
      bordered = true;
    } else {
      src = pick(POOL, prev, rng);
      bordered = position >= TRAP_BORDER_FROM && rng() < BORDER_TRAP_CHANCE;
    }

    const label = src.name.replace("{NAME}", name);
    deck.push({
      id: `card-${position}`,
      kind: "temptation",
      label,
      flav: src.flav,
      photoUrl: null,
      avatarSeed: `${src.seed}-${position}`,
      sameBorderTrap: bordered,
    });
    prev = src.name;
  }

  return deck;
}

/** Card N's decision window, in seconds (BRIEF §7.2 — tuned by playtest,
 * do not lower these again: 2.6s / ×0.94 / 1.1s "była o włos za szybka"). */
export function timerForCard(indexInAttempt: number): number {
  const START = 3.0;
  const DECAY = 0.955;
  const FLOOR = 1.4;
  return Math.max(FLOOR, START * Math.pow(DECAY, indexInAttempt));
}

export const POKUSA_DECK_SIZE = DECK_SIZE;
