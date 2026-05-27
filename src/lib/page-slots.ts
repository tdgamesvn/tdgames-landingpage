// src/lib/page-slots.ts
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type SlotItem = {
  id: number;
  url: string;
  thumb_url?: string | null;
  display_name?: string | null;
  display_label?: string | null;
  sort_order: number;
};

/**
 * Resolve a single slot URL (for Server Components).
 * Returns fallback if not found.
 */
export async function resolveSlot(
  page: string,
  slot: string,
  fallback = "",
): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("page_slots")
      .select("url")
      .eq("page", page)
      .eq("slot", slot)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) return fallback;
    return data.url || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Resolve all items for a carousel slot (for Server Components).
 * Returns empty array if not found.
 */
export async function resolveSlots(
  page: string,
  slot: string,
): Promise<SlotItem[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("page_slots")
      .select("id, url, thumb_url, display_name, display_label, sort_order")
      .eq("page", page)
      .eq("slot", slot)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data as SlotItem[];
  } catch {
    return [];
  }
}
