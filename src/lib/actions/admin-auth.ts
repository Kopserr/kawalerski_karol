"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type SignInResult = { ok: true } | { ok: false; error: string };

/** One account, email + password, Supabase Auth (BRIEF §8). Create it once
 * via the Supabase dashboard (Authentication → Users → Add user) — signup
 * is disabled (`enable_signup = false` in supabase/config.toml) on purpose,
 * this is not a multi-user system. */
export async function signInAction(email: string, password: string): Promise<SignInResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase nie jest skonfigurowany." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: "Złe dane logowania." };
  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin");
}
