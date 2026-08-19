import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { PhasePlaceholder } from "@/components/PhasePlaceholder";
import { getAdminDashboardData } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PhasePlaceholder
        title="Dashboard"
        phaseLabel="Wymaga Supabase"
        description="Panel admina potrzebuje podłączonego projektu Supabase — patrz README. Bez niego nie ma czego zatwierdzać."
        backHref="/"
      />
    );
  }

  const data = await getAdminDashboardData();
  return <AdminDashboardClient initial={data} />;
}
