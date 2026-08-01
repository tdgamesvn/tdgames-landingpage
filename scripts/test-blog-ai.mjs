// Self-check cho src/lib/blog-ai.ts — chạy: node scripts/test-blog-ai.mjs
import assert from "node:assert/strict";
import { slugify, nextFreeSlug, extractJson } from "../src/lib/blog-ai.ts";

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

console.log("blog-ai ok");
