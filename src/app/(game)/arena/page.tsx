import { ArenaClient } from "@/components/board/ArenaClient";
import { getBoardData } from "@/lib/data/board";

export const dynamic = "force-dynamic";

export default async function ArenaPage() {
  const data = await getBoardData();
  return <ArenaClient initial={data} />;
}
