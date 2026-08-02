// Self-check cho src/lib/blog-ai.ts — chạy: node scripts/test-blog-ai.mjs
import assert from "node:assert/strict";
import { slugify, nextFreeSlug, extractJson, BANNED_UI } from "../src/lib/blog-ai.ts";

assert.equal(slugify("Outsourcing Game Art: A Guide"), "outsourcing-game-art-a-guide");
assert.equal(slugify("Đồng bộ animation & nhạc"), "dong-bo-animation-nhac");
assert.equal(slugify("!!!"), "");
assert.ok(!slugify("x".repeat(200)).endsWith("-"), "slug cắt 80 ký tự không được hở dấu -");

assert.equal(nextFreeSlug("guide", []), "guide");
assert.equal(nextFreeSlug("guide", ["guide"]), "guide-2");
assert.equal(nextFreeSlug("guide", ["guide", "guide-2", "guide-3"]), "guide-4");
// slug rỗng (title toàn ký tự lạ) không được sinh ra slug rỗng
assert.equal(nextFreeSlug("", []), "post");
// `like('guide%')` cũng trả về slug của bài khác — không được nhầm là đã chiếm chỗ
assert.equal(nextFreeSlug("guide", ["guidelines-for-vfx"]), "guide");

assert.deepEqual(extractJson('```json\n{"title":"A"}\n```'), { title: "A" });
assert.deepEqual(extractJson('Sure! {"a":[1,2]} hope that helps'), { a: [1, 2] });
assert.throws(() => extractJson("no json here"), /không trả JSON/);

// prompt đòi vẽ UI/bảng giá → chặn, không thì ảnh bịa giá $19/$49/$99
for (const bad of ["glowing pricing table", "abstract dashboard ui", "amber logo mark"]) {
  assert.ok(BANNED_UI.test(bad), `phải chặn: ${bad}`);
}
for (const ok of ["abstract stacked translucent amber planes", "soft volumetric light on charcoal"]) {
  assert.ok(!BANNED_UI.test(ok), `không được chặn: ${ok}`);
}

console.log("blog-ai ok");

// --- placeholder ảnh AI ---
import { findAiImages, applyAiImages } from "../src/lib/blog-ai.ts";

const md = `## A\n\n![Layered passes](ai:abstract amber planes)\n\ntext\n\n![Bad](ai:anime girl)\n\nend`;
const found = findAiImages(md);
assert.equal(found.length, 2);
assert.equal(found[0].alt, "Layered passes");
assert.equal(found[1].prompt, "anime girl");

// url null (sinh lỗi / prompt bị cấm) → xoá placeholder, không để rác markdown
const out = applyAiImages(md, [
  { raw: found[0].raw, url: "https://cdn/x.webp" },
  { raw: found[1].raw, url: null },
]);
assert.ok(out.includes("![Layered passes](https://cdn/x.webp)"));
assert.ok(!out.includes("ai:"), "không được sót placeholder");
assert.ok(!/\n{3,}/.test(out), "không được để 3 dòng trống liên tiếp");
// bài không có ảnh thì giữ nguyên
assert.equal(applyAiImages("## A\n\ntext", []), "## A\n\ntext");

// alt dài lê thê (AI dán nguyên prompt vào alt) → thay bằng tiêu đề bài
const longAlt = `![${"x".repeat(120)}](ai:amber gradient)`;
assert.equal(
  applyAiImages(longAlt, [{ raw: longAlt, url: "https://cdn/y.webp" }], "Tiêu đề bài"),
  "![Tiêu đề bài](https://cdn/y.webp)",
);

console.log("ai images ok");
