// node --test src/lib/hr-upload-type.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { testFileContentType } from "./hr-upload-type.ts";

test("đuôi được phép → content type suy từ đuôi, không hoa thường", () => {
  assert.equal(testFileContentType("bai-lam.PDF"), "application/pdf");
  assert.equal(testFileContentType("anh.jpeg"), "image/jpeg");
  assert.equal(testFileContentType("anh.JPG"), "image/jpeg");
  assert.equal(testFileContentType("clip.mp4"), "video/mp4");
  assert.equal(testFileContentType("scene.blend"), "application/octet-stream");
});

test("đuôi chạy được script trong trình duyệt → từ chối", () => {
  for (const n of ["x.svg", "x.html", "x.htm", "x.xml", "x.js", "x.xhtml", "x.mjs"]) {
    assert.equal(testFileContentType(n), null, n);
  }
});

test("không có đuôi / đuôi lạ / tên kép đánh lừa → từ chối", () => {
  assert.equal(testFileContentType("README"), null);
  assert.equal(testFileContentType("a.exe"), null);
  assert.equal(testFileContentType("a.pdf.html"), null);
  assert.equal(testFileContentType(""), null);
});

test("file văn bản trả text/plain (không phải text/html)", () => {
  assert.equal(testFileContentType("note.md"), "text/plain; charset=utf-8");
  assert.equal(testFileContentType("data.csv"), "text/csv; charset=utf-8");
  assert.equal(testFileContentType("data.json"), "application/json");
});
