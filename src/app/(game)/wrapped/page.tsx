import { WrappedGate } from "@/components/WrappedGate";
import { getBoardData } from "@/lib/data/board";
import { getWrappedExtras } from "@/lib/data/wrapped";

export const dynamic = "force-dynamic";

export default async function WrappedPage() {
  const [data, extras] = await Promise.all([getBoardData(), getWrappedExtras()]);
  return <WrappedGate initial={data} extras={extras} />;
}
