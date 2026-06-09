"use client";

import { useEffect, useState } from "react";

type SlotItem = {
  url: string;
  thumb_url?: string | null;
  display_name?: string | null;
  display_label?: string | null;
  sort_order: number;
  is_active: boolean;
};

// In-memory cache: page+slot → items (shared across all hook instances)
const cache = new Map<string, SlotItem[]>();

/**
 * Fetch all slots for a given page+slot from DB.
 * Returns items sorted by sort_order, with fallback to empty array.
 * Results are cached in memory for the session.
 */
export function usePageSlots(page: string, slot: string): SlotItem[] {
  const key = `${page}:${slot}`;
  const [items, setItems] = useState<SlotItem[]>(cache.get(key) ?? []);

  useEffect(() => {
    if (cache.has(key)) {
      setItems(cache.get(key)!);
      return;
    }

    fetch(`/api/page-slots?page=${encodeURIComponent(page)}&slot=${encodeURIComponent(slot)}`)
      .then((r) => r.json())
      .then((data) => {
        const list: SlotItem[] = data.items ?? [];
        cache.set(key, list);
        setItems(list);
      })
      .catch(() => {/* fallback to empty → caller uses hardcoded */});
  }, [key, page, slot]);

  return items;
}

/**
 * Find a slot URL by display_label, fallback to provided default.
 *
 * Usage:
 *   const slots = usePageSlots("home", "service-card");
 *   const artImg = slotUrl(slots, "service-art", "https://cdn.../fallback.jpg");
 */
export function slotUrl(
  items: SlotItem[],
  label: string,
  fallback: string,
): string {
  const match = items.find((it) => it.display_label === label && it.is_active);
  return match?.url ?? fallback;
}

/**
 * Get slot URL by index, fallback to provided default.
 */
export function slotUrlByIndex(
  items: SlotItem[],
  index: number,
  fallback: string,
): string {
  const item = items[index];
  return item?.is_active ? item.url : fallback;
}
