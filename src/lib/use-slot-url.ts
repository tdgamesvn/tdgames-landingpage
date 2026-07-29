"use client";

import { useEffect, useState } from "react";

/**
 * Logo TD Games ở header + footer. Đổi logo từ /admin → Page Slots,
 * page `global`, slot `brand-logo`. Hằng này chỉ là lưới an toàn khi DB/API lỗi.
 */
export const BRAND_LOGO_FALLBACK =
  "https://cdn.tdgamestudio.com/landing/logoCompany/logo_td2.png";

/**
 * Đọc 1 URL từ Page Slots trong client component.
 * Slot rỗng / fetch lỗi → giữ nguyên fallback, không bao giờ render ảnh trống.
 *
 * Server component thì dùng resolveSlot() trong @/lib/page-slots.
 */
export function useSlotUrl(page: string, slot: string, fallback: string) {
  const [url, setUrl] = useState(fallback);

  useEffect(() => {
    fetch(`/api/page-slots?page=${page}&slot=${slot}&single=1`)
      .then((r) => r.json())
      .then((data: { url?: string }) => {
        if (data.url) setUrl(data.url);
      })
      .catch(() => { /* giữ fallback */ });
  }, [page, slot]);

  return url;
}
