import "server-only";

import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is required");
  }

  if (!supabaseAccessToken) {
    throw new Error("SUPABASE_ACCESS_TOKEN is required");
  }

  return createClient(supabaseUrl, supabaseAccessToken, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
