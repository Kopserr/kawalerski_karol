export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * True once a real Supabase project is wired up. Every data-fetching path
 * checks this first and degrades to a clear "backend not configured"
 * screen instead of throwing — so `npm run build` and a fresh checkout
 * without `.env.local` still work while someone provisions a project.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
