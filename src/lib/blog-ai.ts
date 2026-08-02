// DECISIONS 2026-07-31 + phụ lục 2026-08-01: TD Games bán dịch vụ artist vẽ tay
// → ảnh AI chỉ được dùng làm nền/trừu tượng/sơ đồ. Cấm character & art asset.
export const BANNED =
  /\b(character|nhân vật|portrait|chân dung|mascot|creature|quái|anime|chibi|waifu|hero|knight|warrior|girl|boy|man|woman|người|face|mặt)\b/i;
// gpt-image-2 render chữ rất tốt: prompt "pricing tiers" cho ra bảng giá SaaS
// $19/$49/$99 kèm nút "START FREE TRIAL" — số bịa, mâu thuẫn nội dung bài, và
// khách đọc tưởng là giá thật. Chặn prompt đòi vẽ UI/bảng biểu có chữ.
export const BANNED_UI =
  /\b(pricing table|price tag|rate card|invoice|receipt|dashboard|ui|interface|screenshot|mockup|website|landing page|app screen|button|logo|text|typography|word|number|label|caption)\b/i;

// Helpers thuần cho luồng "radar → bản nháp". Tách ra khỏi route để test được
// bằng scripts/test-blog-ai.mjs (không cần dựng server hay gọi AI).

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/** slug chưa ai dùng: base, base-2, base-3… `taken` là slug đã có trong DB. */
export function nextFreeSlug(base: string, taken: Iterable<string>) {
  const used = new Set(taken);
  const root = base || "post";
  if (!used.has(root)) return root;
  for (let i = 2; ; i++) {
    const candidate = `${root}-${i}`;
    if (!used.has(candidate)) return candidate;
  }
}

/**
 * AI chèn ảnh bằng placeholder `![alt](ai:prompt)` — chưa phải URL. Tìm hết ra
 * để route đi sinh ảnh thật rồi thay lại.
 */
export function findAiImages(md: string) {
  return [...md.matchAll(/!\[([^\]]*)\]\(ai:([^)]*)\)/g)].map((m) => ({
    raw: m[0],
    alt: m[1].trim(),
    prompt: m[2].trim(),
  }));
}

/**
 * Thay placeholder bằng URL thật. `url: null` (sinh ảnh lỗi / prompt dính regex
 * cấm) → xoá hẳn placeholder, bài vẫn đăng được, chỉ thiếu ảnh.
 */
export function applyAiImages(
  md: string,
  results: { raw: string; url: string | null }[],
  fallbackAlt = "",
) {
  let out = md;
  for (const { raw, url } of results) {
    let alt = (raw.match(/!\[([^\]]*)\]/)?.[1] ?? "").trim();
    // AI hay dán nguyên prompt vào alt → alt dài lê thê, lộ là ảnh máy, hại SEO.
    if (!alt || alt.length > 100) alt = fallbackAlt;
    out = out.split(raw).join(url ? `![${alt}](${url})` : "");
  }
  // dọn dòng trống thừa do xoá placeholder
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

/** Lấy object JSON đầu tiên trong text — AI hay bọc thêm ```json hoặc lời dẫn. */
export function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI không trả JSON");
  return JSON.parse(match[0]);
}
