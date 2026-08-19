import { LiveClient } from "@/components/live/LiveClient";
import { getBoardData } from "@/lib/data/board";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const data = await getBoardData();
  return <LiveClient initial={data} />;
}
