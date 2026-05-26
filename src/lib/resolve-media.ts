// src/lib/resolve-media.ts
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Resolve một media URL từ label trong DB.
 * Dùng trong Server Components thay vì hardcode URL.
 *
 * @param label  - slug định danh asset, ví dụ "about-hero"
 * @param fallback - URL fallback nếu không tìm thấy label trong DB
 */
export async function resolveMediaUrl(
  label: string,
  fallback = "",
): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("media_assets")
      .select("current_url")
      .eq("label", label)
      .maybeSingle();
    if (error || !data) return fallback;
    return data.current_url || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Resolve nhiều label cùng lúc (1 query).
 * Trả về map: label → current_url.
 */
export async function resolveMediaUrls(
  labels: string[],
  fallbacks: Record<string, string> = {},
): Promise<Record<string, string>> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("media_assets")
      .select("label, current_url")
      .in("label", labels);
    if (error || !data) return fallbacks;
    const result: Record<string, string> = { ...fallbacks };
    for (const row of data) {
      if (row.label) result[row.label] = row.current_url;
    }
    return result;
  } catch {
    return fallbacks;
  }
}
