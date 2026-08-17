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
- HOUSE STYLE — lean CARTOON. This studio makes stylised casual/cartoon mobile game art (Summoner Era, Axie Infinity Origins, Puzzle Wonderland): chunky readable shapes, exaggerated proportions, clean bold silhouettes, saturated colour, soft painterly cel shading, appealing characters with big expressive faces. Default every post to that. Grim photoreal dark-fantasy concept art is NOT the house look — do not fall back to it out of habit.
- Decide a render style ONCE per post, state it at the start of every prompt, and keep every image in the post — cover included — in that one style. Mixing styles reads as two different articles. Pick from this family, and VARY IT BETWEEN POSTS — do not open every post with the same phrase:
  - "stylised casual mobile game art, cartoon proportions, bold clean shapes, saturated colours, soft cel shading" (the default — use this most often)
  - "hand-painted 2D mobile game art, painterly cartoon stylisation, warm saturated palette"
  - "chibi cartoon game art, oversized head, thick outlines, bright playful palette"
  - "flat vector cartoon illustration, limited palette, thick clean linework"
  - "cel-shaded anime-styled game art, crisp linework, vivid colours"
  - "clean schematic diagram, thin lines on near-black" (only for a genuinely diagrammatic section)
  Photoreal or cinematic-photograph style is allowed only when the post is literally about the real world (a studio office, a hiring interview, a workstation) — and even then, at most one post in several. If in doubt, go cartoon.
- Every image shows a DIFFERENT subject from the others and from the cover.
- Composition must fit the frame. The image is rendered wide (3:2) and any subject that runs past the edge gets sliced in half — a row of six characters becomes four plus two halves. Ask for fewer elements with room around them ("three characters standing apart, wide framing, empty space at both sides") rather than a long row that spills out of frame.
- The site is near-black, so keep the BACKGROUND of the image dark or deep-toned so it sits on the page — but the subject itself should be colourful and lively, not desaturated. Cartoon art with saturated hero colours on a dark background is exactly right; a whole image drowned in charcoal-and-amber is not. Vary the accent colour between posts (teal, magenta, lime, ice blue…), not amber every single time.
- One hard caution, not a ban: the generator renders text very well and will happily invent prices, percentages and labels that contradict the article. If you ask for any text, numbers or a UI in an image, you own the risk — prefer wordless compositions unless the text is the whole point.
- Example: stylised casual mobile game art, cartoon proportions, a cheerful round-bodied mascot creature holding a paintbrush twice its size, bold clean silhouette, saturated teal and orange, soft cel shading, deep blue-black background
- Example: hand-painted 2D mobile game art, painterly cartoon stylisation, side-scroller parallax of a cliff edge and distant ruins in three clear depth layers, chunky readable shapes, warm sunset palette against a dark sky
- Example: stylised casual mobile game art, a row of five frames of a fire impact effect breaking apart into embers and smoke, exaggerated cartoon VFX shapes, vivid orange and magenta on near-black
- Example: clean schematic diagram of five connected production stages flowing left to right as simple geometric blocks and arrows, thin amber lines on near-black`;

/**
 * Sếp 2026-08-17: 8/8 cover trên /blog là CÙNG một ảnh — một anh cartoon râu-kính
 * đứng giữa, cầm vật phát sáng, icon lơ lửng quanh, nền xanh-đen. Không phải AI
 * lười: luật cũ ép đúng cái đó ("prefer a living hero subject, large and centred"
 * + "one dramatic light source" + "one clear focal subject"). Lời khuyên mềm
 * "VARY IT BETWEEN POSTS" vô hiệu vì mỗi bài dựng trong một call độc lập, AI
 * không thấy cover bài trước.
 *
 * Nên ép đa dạng bằng CODE: bốc ngẫu nhiên một archetype + một accent palette rồi
 * nhét vào prompt như yêu cầu bắt buộc.
 *
 * ponytail: random không nhớ lịch sử → vẫn có thể trùng archetype hai bài liên
 * tiếp (~1/7). Chấp nhận, hơn hẳn 8/8 như cũ. Muốn triệt để thì query
 * `cover_prompt` của N bài gần nhất từ blog_posts rồi loại archetype đã dùng.
 */
const COVER_ARCHETYPES = [
  "HERO CHARACTER — one appealing cartoon character or creature, large and centred, readable expression, splash-art energy. Only if the post really is about people/roles.",
  "ESTABLISHING ENVIRONMENT — a place, no character or only a tiny one for scale: a studio floor, a game level seen side-on, a landscape in three depth layers. Wide cinematic shot.",
  "PROP / ASSET STILL LIFE — the objects of the craft, no character at all: stacked tilesets, a rig skeleton, brushes and tablets, an icon sheet, a shelf of finished assets. Close and tactile.",
  "PROCESS STRIP — the same subject repeated across stages left to right: sketch → line → flats → render, or four frames of an animation, or three revision passes. Repetition IS the composition.",
  "ISOMETRIC DIORAMA — a small world on a floating platform, seen from a high 3/4 angle, like a board-game piece or a mobile-game level select. No front-facing portrait.",
  "SPLIT COMPOSITION — one frame cut into two contrasting halves (good vs bad, before vs after, cheap vs expensive), each half readable on its own.",
  "MACRO CLOSE-UP — one detail blown up huge and cropped tight: a hand mid-brushstroke, a single VFX spark sheet, one eye of a character, the seam where two tiles meet. Extreme scale, not a full figure.",
];

const COVER_PALETTES = [
  "teal and hot coral on deep navy",
  "magenta and violet on near-black plum",
  "lime and cyan on deep forest green",
  "ice blue and white on midnight indigo",
  "warm amber and crimson on charcoal",
  "peach and turquoise on deep aubergine",
];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/**
 * Luật riêng cho ảnh cover. Cover render 1536x1024 nhưng hiển thị 3 chỗ với 3 tỉ
 * lệ khác nhau, tất cả đều `object-cover` (tức là CẮT, không co):
 *   - card danh sách /blog + trang chủ: ~210x180, gần vuông → cắt mất 2 bên
 *   - hero trang bài: full width, h-96 → cắt mất trên/dưới
 * Nên chủ thể phải nằm gọn trong ô vuông giữa ảnh, và bé như avatar vẫn đọc ra.
 *
 * Gọi hàm (không phải hằng) vì mỗi bài phải bốc archetype/palette khác nhau.
 */
export const coverRules = () => `COVER IMAGE — extra rules on top of the above, because the cover is reused at three different crops:

MANDATORY FOR THIS POST — the cover MUST use this archetype, not any other:
  ${pick(COVER_ARCHETYPES)}
MANDATORY accent palette for this cover: ${pick(COVER_PALETTES)}.
These two are assigned, not suggestions. Do not substitute a centred character portrait if the archetype above is not the character one — every recent cover on this blog is a centred character and readers have noticed. Build the composition the archetype describes, then make it work at thumbnail size using the rules below.

- It is displayed full-width at the top of the article, AND as a small near-square thumbnail (about 200x180) in the blog list and on the homepage. The browser crops, never shrinks: the square version keeps only the MIDDLE of the image and throws both sides away.
- So the whole idea must live in the CENTRE SQUARE of the frame. Treat the left and right thirds as decoration that will be cut off. Never put the main subject off to one side, and never build the image around a wide row of small items — a row of six props becomes two props in the thumbnail.
- One clear focal subject, large in frame, on a simple uncluttered background. Busy scenes with many small elements turn to mush at 200px.
- Strong silhouette and high contrast against the dark background, so the thumbnail still reads at a glance in a list of cards.
- No important detail near any edge — top, bottom, left or right — one of the three crops will eat it.
- MAKE IT ARRESTING. The cover is the first and often only thing a reader sees — it has to earn the click against every other card on the page. Brief it as key art / a splash screen, never as a neutral illustration:
  - Depth, not a flat cutout. Build a foreground, a midground and a background so the eye travels into the image. Objects floating on an empty black field look like clip art.
  - One dramatic light source doing real work — warm amber rim light, glow spilling from a window or a fire, light raking across a surface. Flat even lighting reads as a stock asset.
  - A hero angle: low and looking up for scale, or a wide cinematic establishing shot. Not a flat catalogue view.
  - Atmosphere sells it: haze, drifting dust, mist, rain, embers, light shafts. One such effect, not all of them.
  - Whatever the assigned archetype is, it needs ONE dominant shape that survives at 200px — a big silhouette, a bold colour block, a strong diagonal. What kills a thumbnail is many small scattered elements, not the absence of a character. An environment, a prop or a process strip works fine as long as one element is clearly the largest thing in the centre square.
  - Do NOT decorate the subject with a ring of small floating icons, sparks or symbols orbiting it. That is the laziest depth cue the generator knows and it has made every cover on this blog look identical. Get depth from staging — something near, something far, something occluding something else.
  - The page behind the card is near-black. An image that is ALSO near-black everywhere reads as an empty rectangle in the list. Keep the BACKGROUND deep, but the hero subject must be bright and saturated against it — a glow, a fire, a rim light, a punchy colour block carrying the eye to it.
  - Give it a mood that matches the post's argument — a calm confident scene for a "how we work" piece, tension and contrast for a "this goes wrong" piece.
- Still relevant, never decorative. Arresting does not mean generic epic fantasy: the scene must be something a reader of THIS post would recognise as belonging to it. If the post compares two options, show two, in one composition.
- End the cover prompt with "no text, no lettering, no signage". The generator invents signs and banners unprompted, and half a made-up word sliced by the thumbnail crop is the first thing a reader sees on the blog list. In-post images can take the risk; the cover cannot.`;

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
