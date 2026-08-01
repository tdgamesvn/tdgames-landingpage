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

/** Lấy object JSON đầu tiên trong text — AI hay bọc thêm ```json hoặc lời dẫn. */
export function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI không trả JSON");
  return JSON.parse(match[0]);
}
