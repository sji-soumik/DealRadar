import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client. Returns null when the env vars are missing so
// callers can fall back to the in-memory store (same pattern as the OpenAI
// key: the demo always works offline).
let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client =
    url && key
      ? createClient(url, key, { auth: { persistSession: false } })
      : null;
  return client;
}
