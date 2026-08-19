import { TaskCard } from "@/components/task/TaskCard";
import { getBoardData } from "@/lib/data/board";

export const dynamic = "force-dynamic";

export default async function TilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getBoardData();
  return <TaskCard tileId={Number(id)} variant="page" initial={data} />;
}
