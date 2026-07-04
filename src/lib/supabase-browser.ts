"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Browser-side Supabase client (anon key). Used only for realtime broadcast
// subscriptions — RLS blocks all direct table access with this key.
let client: SupabaseClient | null | undefined;

export function getBrowserSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}
