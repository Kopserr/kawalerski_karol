import type { GameEvent, Minigame, Tile, TileState } from "@/lib/types";
import type { GalleryItem } from "@/lib/data/wrapped";
import type { WrappedStats } from "@/lib/wrapped/computeStats";

export interface WrappedData {
  tiles: Tile[];
  tileStates: Record<number, TileState>;
  minigames: Minigame[];
  events: GameEvent[];
  gallery: GalleryItem[];
  stats: WrappedStats;
  groomName: string;
  brideName: string;
  eventDateLabel: string;
}
