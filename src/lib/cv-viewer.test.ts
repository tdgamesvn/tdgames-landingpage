// node --test src/lib/cv-viewer.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { cvViewerUrl } from "./cv-viewer.ts";

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
