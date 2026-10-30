// node --test src/lib/json-ld.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { absoluteUrl, breadcrumbJsonLd, serializeJsonLd, toIsoDate } from "./json-ld.ts";

test("serializeJsonLd escape `<` để không thoát khỏi thẻ script", () => {
  const out = serializeJsonLd({ headline: "a</script><script>alert(1)</script>" });
  assert.ok(!out.includes("<"));
  assert.deepEqual(JSON.parse(out), { headline: "a</script><script>alert(1)</script>" });
});

test("absoluteUrl: path tương đối → URL site, URL tuyệt đối giữ nguyên", () => {
  assert.equal(absoluteUrl("/"), "https://tdgamestudio.com");
  assert.equal(absoluteUrl("/blog/x"), "https://tdgamestudio.com/blog/x");
  assert.equal(absoluteUrl("https://cdn.tdgamestudio.com/a.png"), "https://cdn.tdgamestudio.com/a.png");
});

test("breadcrumbJsonLd: position đánh từ 1, mục cuối có thể không có item", () => {
  const b = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Portfolio", path: "/portfolio" }, { name: "X" }]);
  assert.equal(b["@type"], "BreadcrumbList");
  assert.deepEqual(b.itemListElement.map((i) => i.position), [1, 2, 3]);
  assert.equal(b.itemListElement[0].item, "https://tdgamestudio.com");
  assert.equal("item" in b.itemListElement[2], false);
});

test("toIsoDate: timestamptz Supabase → ISO 8601 có Z; rỗng/sai → undefined", () => {
  assert.equal(toIsoDate("2026-10-30T06:52:55.76809+00:00"), "2026-10-30T06:52:55.768Z");
  assert.equal(toIsoDate("2026-10-30T13:52:55+07:00"), "2026-10-30T06:52:55.000Z");
  assert.equal(toIsoDate(null), undefined);
  assert.equal(toIsoDate("not a date"), undefined);
});
