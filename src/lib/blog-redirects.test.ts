// node --test src/lib/blog-redirects.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildBlogRedirects, validateBlogRedirects } from "./blog-redirects.ts";

const r = (from: string, to: string) => ({ from, to });

test("danh sách thật hợp lệ (91 mục)", () => {
  const list = JSON.parse(readFileSync(new URL("../content/blog-redirects.json", import.meta.url), "utf8"));
  assert.equal(list.length, 91);
  assert.deepEqual(validateBlogRedirects(list), []);
});
test("bắt from trùng", () => {
  assert.equal(validateBlogRedirects([r("a", "x"), r("a", "y")]).length, 1);
});
test("bắt from === to", () => {
  assert.ok(validateBlogRedirects([r("a", "a")]).length >= 1);
});
test("bắt chuỗi redirect", () => {
  assert.ok(validateBlogRedirects([r("a", "b"), r("b", "c")]).some((e) => e.includes("chuỗi")));
});
test("bắt slug sai định dạng", () => {
  assert.equal(validateBlogRedirects([r("A_b", "x"), r("a", "x/y")]).length, 2);
});
test("buildBlogRedirects map 301 và throw khi sai", () => {
  assert.deepEqual(buildBlogRedirects([r("a", "b")]), [
    { source: "/blog/a", destination: "/blog/b", statusCode: 301 },
  ]);
  assert.throws(() => buildBlogRedirects([r("a", "a")]));
});
