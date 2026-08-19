import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * service_role client — bypasses RLS entirely. Server Actions only
 * (`import "server-only"` makes an accidental client-side import a build
 * error). This is the one path allowed to write game state or upload
 * proofs (BRIEF §10: "nigdy z klienta").
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!SUPABASE_URL || !key) {
    throw new Error(
      "Supabase nie jest skonfigurowany — brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createSupabaseClient<Database>(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
