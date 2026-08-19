export interface PokusaCard {
  id: string;
  kind: "fiancee" | "temptation";
  label: string;
  /** Flavour text under the name — from the prototype's pool, never a
   * giveaway either way (BRIEF §7.2's "zasada krytyczna dla balansu"). */
  flav: string;
  /** Only ever set for the fiancée, and only if admin uploaded a photo. */
  photoUrl: string | null;
  /** Seeds the procedural fallback avatar (BRIEF §7.2 — must be playable
   * with zero uploads). */
  avatarSeed: string;
  /** From card 8 — some temptations borrow the fiancée's border color.
   * Impostors (from card 14) are always bordered. */
  sameBorderTrap: boolean;
}

export type PokusaStatus = "preparing" | "playing" | "mistake" | "won";

/** Why the last attempt ended — drives the mistake screen's copy
 * (prototype: CZAS / ODRZUCIŁEŚ JĄ / WPUŚCIŁEŚ POKUSĘ are three different
 * beats, not one generic "you messed up"). */
export type MistakeReason = "timeout" | "rejected-her" | "accepted-temptation";
