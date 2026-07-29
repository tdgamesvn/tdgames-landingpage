// src/lib/page-slots.ts
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { ServiceCapabilityItem } from "@/components/service-capabilities-grid";

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
 * Card "What we do" của 3 trang service — slot `service-card`.
 * Map: url → image, display_name → title, display_label → description.
 * Slot rỗng (hoặc DB lỗi) → trả nguyên defaults, trang không bao giờ trống.
 */
export async function resolveServiceCards(
  page: string,
  defaults: ServiceCapabilityItem[],
): Promise<ServiceCapabilityItem[]> {
  const items = await resolveSlots(page, "service-card");
  if (!items.length) return defaults;
  return items.map((it, i) => ({
    image: it.url,
    title: it.display_name || defaults[i]?.title || "",
    description: it.display_label || defaults[i]?.description || "",
  }));
}

/**
 * Card "Featured showcase" của 3 trang service — slot `featured-card`.
 * Map: url → image, display_name → title, display_label → description.
 * `statValue`/`statLabel`/`icon`/`href` không có cột tương ứng trong page_slots
 * nên lấy theo index từ defaults — sếp cần sửa số liệu thì phải sửa code.
 */
export async function resolveFeaturedCards<T extends { title: string; description: string; image: string }>(
  page: string,
  defaults: T[],
): Promise<T[]> {
  const items = await resolveSlots(page, "featured-card");
  if (!items.length) return defaults;
  return items.map((it, i) => ({
    ...(defaults[i] ?? defaults[0]),
    image: it.url,
    title: it.display_name || defaults[i]?.title || "",
    description: it.display_label || defaults[i]?.description || "",
  }));
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
