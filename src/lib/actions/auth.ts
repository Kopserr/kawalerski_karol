"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Checks the code against `game_state.access_code` server-side — that
 * column is deliberately excluded from `game_state_public` and from every
 * anon RLS policy (BRIEF §10), so the comparison can only happen here, not
 * in client JS. Falls back to GROOM_ACCESS_CODE / the BRIEF default so the
 * gate still works before a Supabase project is wired up.
 */
export async function verifyGroomCodeAction(code: string): Promise<boolean> {
  const trimmed = code.trim().toUpperCase();

  if (!isSupabaseConfigured()) {
    const fallback = process.env.GROOM_ACCESS_CODE ?? "MALTA26";
    return trimmed === fallback.toUpperCase();
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("game_state")
    .select("access_code")
    .eq("id", 1)
    .maybeSingle();

  const expected = data?.access_code ?? process.env.GROOM_ACCESS_CODE ?? "MALTA26";
  return trimmed === expected.toUpperCase();
}
