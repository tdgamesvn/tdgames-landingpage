// DECISIONS 2026-08-03: bỏ hết chặn nội dung ảnh AI (regex BANNED / BANNED_UI,
// STYLE_SUFFIX). Sếp chốt AI tự quyết ảnh, miễn hợp bài. Bài luôn published:false
// nên sếp vẫn là chốt chặn cuối trước khi đăng.

/**
 * Luật viết prompt ảnh — dùng chung cho lúc dựng bài mới (api/admin/blog/topics)
 * và lúc render lại ảnh bài cũ (api/admin/blog/reimage). Để ở một chỗ, không thì
 * sửa một bên là hai luồng ra hai gu ảnh khác nhau.
 */
export const IMAGE_RULES = `IMAGE PROMPT rules — you have full creative freedom. There is no allow-list and no forbidden subject. Pick whatever image genuinely serves THIS section: characters, environments, props, tilesets, VFX frames, an animation strip, a workshop scene, a schematic, a photograph, a diorama, an abstract study. Judge every prompt by one question: does a reader who sees only this image understand what this part of the post is about?
- Write the prompt like an art director briefing an illustrator: subject first, then composition, lighting and finish. Be specific — "three depth layers of a cliffside parallax with distant ruins" beats "game art background".
- Do NOT settle for a vague metaphor when the section has something concrete to show. Stacked paper for "layered cost" and torn edges for "a broken handoff" are stock filler; show the actual asset, step, or scene instead. Use an abstract or metaphorical image only when the section truly has no concrete subject.
- Decide a render style ONCE per post, state it at the start of every prompt ("hand-painted 2D mobile game art of...", "cinematic photograph of...", "clean schematic diagram of..."), and keep every image in the post — cover included — in that one style. Mixing styles reads as two different articles.
- Every image shows a DIFFERENT subject from the others and from the cover.
- The site is near-black, so images that sit on a dark, low-key, restrained palette (charcoal with amber warmth) blend best. Break that when the post genuinely calls for it, but never for no reason.
- One hard caution, not a ban: the generator renders text very well and will happily invent prices, percentages and labels that contradict the article. If you ask for any text, numbers or a UI in an image, you own the risk — prefer wordless compositions unless the text is the whole point.
- Example: hand-painted 2D mobile game art, side-scroller parallax background of a cliff edge and distant ruins separated into three depth layers, casual stylised painterly shading, amber key light and cool rim, near-black sky
- Example: hand-painted 2D mobile game art, a row of five frames of a fire impact effect breaking apart into embers and smoke, stylised game VFX shapes, amber and charcoal, near-black background
- Example: clean schematic diagram of five connected production stages flowing left to right as simple geometric blocks and arrows, thin amber lines on near-black`;

/** Ảnh markdown thường (đã có URL thật) — dùng khi render lại ảnh bài cũ. */
export function findMarkdownImages(md: string) {
  return [...md.matchAll(/!\[([^\]]*)\]\((?!ai:)([^)\s]+)\)/g)].map((m) => ({
    raw: m[0],
    alt: m[1],
    url: m[2],
  }));
}

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
    // Cắt ở ranh giới từ: `.slice(0, 80)` trần trụi đẻ ra
    // `...where-hidden-fees-hi` (chữ "hide" cụt) — xấu cả URL lẫn SEO.
    .replace(/^(.{0,80})(-|$)[\s\S]*$/, "$1")
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
