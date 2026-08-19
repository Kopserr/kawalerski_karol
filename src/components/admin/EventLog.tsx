import { CATEGORY_LABEL } from "@/lib/categories";
import type { GameEvent, Tile } from "@/lib/types";

const EVENT_LABEL: Record<string, string> = {
  tile_opened: "otworzył",
  proof_sent: "wysłał dowód",
  approved: "zaliczono",
  rejected: "odrzucono",
  bingo: "BINGO",
  arena_unlocked: "arena odblokowana",
  minigame_won: "arena przejęta",
  minigame_failed: "próba areny",
  game_finished: "GRA UKOŃCZONA",
  game_paused: "pauza",
  game_resumed: "wznowiono",
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

export function EventLog({ events, tiles }: { events: GameEvent[]; tiles: Tile[] }) {
  return (
    <div className="glass max-h-96 overflow-y-auto rounded-2xl p-3">
      <h2 className="mb-2 px-1 font-heading text-sm tracking-[0.2em] text-fog">LIVE LOG</h2>
      <div className="flex flex-col divide-y divide-white/5">
        {events.length === 0 && (
          <p className="px-1 py-3 text-sm text-fog">Brak zdarzeń.</p>
        )}
        {events.map((e) => {
          const tile = e.tileId ? tiles.find((t) => t.id === e.tileId) : undefined;
          return (
            <div key={e.id} className="flex items-center justify-between px-1 py-2 text-xs">
              <span className="text-off-white">
                {EVENT_LABEL[e.type] ?? e.type}
                {tile && (
                  <>
                    {" "}
                    <span className="text-cyan">{tile.title}</span>{" "}
                    <span className="text-fog">({CATEGORY_LABEL[tile.category]})</span>
                  </>
                )}
              </span>
              <span className="shrink-0 text-fog">{formatTime(e.createdAt)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
