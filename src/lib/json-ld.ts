// Helper dùng chung cho structured data (JSON-LD). Hàm thuần — test: node --test src/lib/json-ld.test.ts
// Render thì dùng <JsonLd data={...} /> ở src/components/json-ld.tsx.

export const SITE_URL = "https://tdgamestudio.com";
/** @id của Organization (khai ở root layout) — các schema khác trỏ về đây thay vì lặp lại. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const ORG_LOGO = "https://cdn.tdgamestudio.com/landing/logoCompany/logo_td_notext.png";

/**
 * JSON.stringify an toàn để nhét vào <script>: escape `<` (chặn "</script>" trong
 * title/excerpt thoát khỏi thẻ) và U+2028/U+2029.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/[\u2028]/g, "\\u2028")
    .replace(/[\u2029]/g, "\\u2029");
}

/** Đường dẫn tương đối → URL tuyệt đối của site; URL tuyệt đối giữ nguyên. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl === "/" || pathOrUrl === "") return SITE_URL;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * BreadcrumbList. Mục cuối được phép không có path (Google chấp nhận ListItem
 * cuối không có `item`) — dùng khi component không biết slug của trang.
 */
export function breadcrumbJsonLd(items: { name: string; path?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.path !== undefined ? { item: absoluteUrl(it.path) } : {}),
    })),
  };
}

/** Ngày bất kỳ (chuỗi Supabase timestamptz, Date…) → ISO 8601 UTC có múi giờ; sai → undefined. */
export function toIsoDate(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}
