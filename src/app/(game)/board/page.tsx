import { BoardClient } from "@/components/board/BoardClient";
import { getBoardData } from "@/lib/data/board";

// Needs a fresh read on every visit — tile/minigame state changes constantly.
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const data = await getBoardData();
  return <BoardClient initial={data} />;
}
