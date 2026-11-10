// node --test src/lib/lead-ack-email.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  LEAD_ACK_FOOTER_EN,
  buildLeadAckEmail,
  getLeadAckConfig,
  ilikeExact,
  isVietnamese,
  leadAckEnvelope,
  quoteMessage,
} from "./lead-ack-email.ts";
import { LEAD_OWNER_EMAIL, gmailComposeUrl, gmailThreadUrl } from "./leads.ts";

test("config: mặc định test, chỉ LEAD_ACK_MODE=live mới live; From/owner là hộp của sếp", () => {
  assert.equal(getLeadAckConfig({}).mode, "test");
  assert.equal(getLeadAckConfig({ LEAD_ACK_MODE: "LIVE" }).mode, "test");
  assert.equal(getLeadAckConfig({ HR_EMAIL_MODE: "live" }).mode, "test");
  const live = getLeadAckConfig({ LEAD_ACK_MODE: "live", RESEND_API_KEY: " k " });
  assert.equal(live.mode, "live");
  assert.equal(live.apiKey, "k");
  assert.equal(live.owner, LEAD_OWNER_EMAIL);
  assert.match(live.from, new RegExp(`<${LEAD_OWNER_EMAIL}>$`));
});

test("envelope: test → về hộp chủ, không BCC; live → khách + BCC chủ", () => {
  const t = leadAckEnvelope(getLeadAckConfig({}), "a@b.com", "Hi");
  assert.deepEqual(t, { to: LEAD_OWNER_EMAIL, bcc: [], subject: "[TEST → a@b.com] Hi", testMode: true });
  const l = leadAckEnvelope(getLeadAckConfig({ LEAD_ACK_MODE: "live" }), "a@b.com", "Hi");
  assert.deepEqual(l, { to: "a@b.com", bcc: [LEAD_OWNER_EMAIL], subject: "Hi", testMode: false });
});

test("tiếng Anh: chào tên, dịch vụ, hứa 1 ngày làm việc, chữ ký, trích tin, footer", () => {
  const m = buildLeadAckEmail({ name: "John Smith", service: "2D Animation", message: "Need 10 characters" });
  assert.equal(m.lang, "en");
  assert.equal(m.subject, "We've received your request — TD Games Studio");
  assert.match(m.text, /^Hi John Smith,/);
  assert.match(m.text, /your request for 2D Animation and will get back to you personally within 1 business day/);
  assert.match(m.text, /https:\/\/tdgamestudio\.com\/portfolio/);
  assert.match(m.text, /Talk soon,\nToan Dang\nTD Games Studio/);
  assert.match(m.text, /Your message:\n> Need 10 characters/);
  assert.ok(m.text.endsWith(LEAD_ACK_FOOTER_EN));
});

test("Other → không ghi 'for Other'; không có tin → không có mục trích", () => {
  const m = buildLeadAckEmail({ name: "Ann", service: "Other", message: "  " });
  assert.match(m.text, /received your request and will/);
  assert.doesNotMatch(m.text, /Other/);
  assert.doesNotMatch(m.text, /Your message/);
});

test("tên trông như link/email bị bỏ khỏi lời chào", () => {
  assert.match(buildLeadAckEmail({ name: "evil.com/win", service: "2D Art", message: "" }).text, /^Hi there,/);
  assert.match(buildLeadAckEmail({ name: "x@y.com", service: "2D Art", message: "" }).text, /^Hi there,/);
});

test("khách viết tiếng Việt → mail tiếng Việt", () => {
  assert.equal(isVietnamese("Nguyễn Văn A", ""), true);
  assert.equal(isVietnamese("John", "hello"), false);
  const m = buildLeadAckEmail({ name: "Minh", service: "2D Art", message: "Mình cần vẽ 5 nhân vật" });
  assert.equal(m.lang, "vi");
  assert.match(m.text, /^Chào Minh,/);
  assert.match(m.text, /yêu cầu về 2D Art và sẽ trực tiếp phản hồi trong vòng 1 ngày làm việc/);
  assert.match(m.text, /Nội dung anh\/chị đã gửi:\n> Mình cần vẽ 5 nhân vật/);
});

test("trích tin: bỏ link/tên miền, mỗi dòng '> ', cắt dài", () => {
  const q = quoteMessage("See https://evil.example/login and www.bad.io\nor phish.co/x?y=1 ok");
  assert.equal(q, "> See [link] and [link]\n> or [link] ok");
  assert.doesNotMatch(quoteMessage("mail me at a@evil.com"), /evil/);
  const long = quoteMessage("a".repeat(5000));
  assert.ok(long.length < 1600);
  assert.ok(long.endsWith("…"));
});

test("ilikeExact escape wildcard", () => {
  assert.equal(ilikeExact("a_b%c\\d@x.com"), "a\\_b\\%c\\\\d@x.com");
});

test("link Gmail đúng tài khoản", () => {
  const c = new URL(gmailComposeUrl("a@b.com", "Re: x", "body"));
  assert.equal(c.searchParams.get("authuser"), LEAD_OWNER_EMAIL);
  assert.equal(c.searchParams.get("view"), "cm");
  assert.equal(c.searchParams.get("to"), "a@b.com");
  assert.equal(c.searchParams.get("su"), "Re: x");
  assert.equal(c.searchParams.get("body"), "body");
  assert.equal(new URL(gmailComposeUrl("a@b.com")).searchParams.has("su"), false);
  assert.match(gmailThreadUrl("a+1@b.com"), /#search\/a%2B1%40b\.com$/);
});
