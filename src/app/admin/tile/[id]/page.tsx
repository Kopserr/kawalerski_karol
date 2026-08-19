import { notFound } from "next/navigation";
import { TileEditForm } from "@/components/admin/TileEditForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PhasePlaceholder } from "@/components/PhasePlaceholder";
import { getAdminDashboardData } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function AdminTileEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <PhasePlaceholder
        title="Edycja zadania"
        phaseLabel="Wymaga Supabase"
        description="Edycja treści zadań wymaga podłączonego projektu Supabase."
        backHref="/admin/dashboard"
      />
    );
  }

  const { id } = await params;
  const data = await getAdminDashboardData();
  const tile = data.tiles.find((t) => t.id === Number(id));
  if (!tile) notFound();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col bg-void safe-x safe-bottom">
      <AdminHeader title={`Zadanie ${String(tile.id).padStart(2, "0")}`} />
      <div className="px-4 py-4">
        <TileEditForm
          tile={tile}
          groomPhoto={data.groomPhoto}
          bridePhoto={data.bridePhoto}
          brideName={data.brideName}
        />
      </div>
    </main>
  );
}
