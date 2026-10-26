// node --test src/lib/cv-viewer.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { cvViewerUrl, safeExternalUrl } from "./cv-viewer.ts";

test("PDF nhúng thẳng, vừa chiều ngang, ẩn thanh thumbnail", () => {
  const u = "https://cdn.tdgamestudio.com/cv/a.pdf";
  assert.equal(cvViewerUrl(u), `${u}#navpanes=0&view=FitH`);
});

test("Word (.docx/.doc) qua trình xem Office Online, URL được encode", () => {
  const u = "https://cdn.tdgamestudio.com/cv/Nguyễn A.docx";
  assert.equal(
    cvViewerUrl(u),
    `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(u)}`,
  );
  assert.ok(cvViewerUrl("https://cdn.tdgamestudio.com/x.DOC")!.startsWith("https://view.officeapps.live.com/"));
});

test("đuôi lạ, link ngoài, http hay rác → không nhúng (null)", () => {
  assert.equal(cvViewerUrl("https://cdn.tdgamestudio.com/cv/a.zip"), null);
  assert.equal(cvViewerUrl("https://drive.google.com/file/d/x/view"), null);
  assert.equal(cvViewerUrl("javascript:alert(1)"), null);
  assert.equal(cvViewerUrl(""), null);
  assert.equal(cvViewerUrl(null), null);
});

test("chỉ nhúng từ cdn.tdgamestudio.com — không nhúng cùng origin với /hr", () => {
  assert.equal(cvViewerUrl("https://tdgamestudio.com/x.pdf"), null);
  assert.equal(cvViewerUrl("https://www.tdgamestudio.com/x.pdf"), null);
  assert.equal(cvViewerUrl("https://evil-tdgamestudio.com/x.pdf"), null);
  assert.ok(cvViewerUrl("https://cdn.tdgamestudio.com/x.pdf"));
});

test("safeExternalUrl chỉ trả link http(s), chặn javascript:/data:", () => {
  assert.equal(safeExternalUrl("https://drive.google.com/file/d/x"), "https://drive.google.com/file/d/x");
  assert.equal(safeExternalUrl("  https://www.behance.net/a "), "https://www.behance.net/a");
  assert.equal(safeExternalUrl("http://x.com/a"), "http://x.com/a");
  for (const bad of ["javascript:alert(1)", " JavaScript:alert(1)", "data:text/html,<script>", "vbscript:x", "", null, undefined, "not a url"]) {
    assert.equal(safeExternalUrl(bad), null, String(bad));
  }
});
