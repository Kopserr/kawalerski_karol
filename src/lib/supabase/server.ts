import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Server client (anon key, cookie-aware) — for Server Components and
 * Server Actions that only need public/RLS-gated reads. Auth cookies
 * matter once /admin (Supabase Auth) lands in Phase 3; the groom/spectator
 * paths never carry a session, so reads just run as `anon`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render — middleware refreshes
          // the session instead. Safe to ignore here.
        }
      },
    },
  });
}
