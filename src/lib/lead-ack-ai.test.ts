// node --test src/lib/lead-ack-ai.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { ackSendAt, buildAckUserMessage, composeAiAck, guardAckDraft, scheduledAtParam } from "./lead-ack-ai.ts";
import { LEAD_ACK_FOOTER_EN, LEAD_ACK_FOOTER_VI } from "./lead-ack-email.ts";

const okBody =
  "Hi John,\n\nThanks for reaching out about the idle and attack animations for your 10 Spine characters — that sounds like a fun project.\n\nTo prepare an accurate quote, could you share:\n- A few art style references\n- Your target deadline\n\nWe'll get back to you within 1 business day (Vietnam time, GMT+7).\n\nTalk soon,";
const j = (o: Record<string, unknown>) => JSON.stringify(o);

test("nháp hợp lệ → qua, giữ lang/subject/body", () => {
  const r = guardAckDraft("```json\n" + j({ lang: "en", subject: "Your Spine animation project", body: okBody }) + "\n```");
  assert.ok("draft" in r);
  assert.equal(r.draft.lang, "en");
  assert.equal(r.draft.subject, "Your Spine animation project");
  assert.match(r.draft.body, /Talk soon,$/);
});

test("loại: JSON hỏng, rỗng, quá ngắn/dài", () => {
  assert.ok("reject" in guardAckDraft("not json"));
  assert.ok("reject" in guardAckDraft(j({ subject: "", body: okBody })));
  assert.ok("reject" in guardAckDraft(j({ subject: "Hi", body: "Thanks!" })));
  assert.ok("reject" in guardAckDraft(j({ subject: "Hi there", body: "a ".repeat(900) })));
});

test("loại: có link / tên miền / email / chấm Unicode", () => {
  for (const bad of ["see https://evil.example", "visit evil.com today", "mail x@evil.io", "go evil。com", "ｅｖｉｌ．ｃｏｍ"]) {
    const r = guardAckDraft(j({ lang: "en", subject: "Your project", body: `${okBody}\n${bad}` }));
    assert.ok("reject" in r, bad);
  }
});

test("cho phép e.g. / i.e. và chấm cuối câu", () => {
  const r = guardAckDraft(j({ lang: "en", subject: "Your project", body: `${okBody}\nReferences (e.g. games you like) help. Thanks.` }));
  assert.ok("draft" in r);
});

test("loại: nhắc tiền/giá", () => {
  for (const bad of ["Your budget of $5k works.", "around 500 USD", "khoảng 10 triệu", "€200"]) {
    assert.ok("reject" in guardAckDraft(j({ lang: "en", subject: "Your project", body: `${okBody}\n${bad}` })), bad);
  }
});

test("loại: AI tự ký tên", () => {
  assert.ok("reject" in guardAckDraft(j({ lang: "en", subject: "Your project", body: `${okBody}\nToan Dang` })));
});

test("lang lạ → en", () => {
  const r = guardAckDraft(j({ lang: "english", subject: "Your project", body: okBody }));
  assert.ok("draft" in r && r.draft.lang === "en");
});

test("ghép mail: lời chào cuối → chữ ký + portfolio → footer; không trích tin khách", () => {
  const m = composeAiAck({ lang: "en", subject: "S", body: okBody });
  assert.equal(m.subject, "S");
  assert.match(m.text, /Talk soon,\nToan Dang\nTD Games Studio — 2D Art, Animation & VFX for Games\nhttps:\/\/tdgamestudio\.com\/portfolio\n\n/);
  assert.doesNotMatch(m.text, /Your message/);
  assert.ok(m.text.endsWith(LEAD_ACK_FOOTER_EN));
  assert.ok(composeAiAck({ lang: "vi", subject: "S", body: "Chào Minh" }).text.endsWith(LEAD_ACK_FOOTER_VI));
  assert.ok(composeAiAck({ lang: "ja", subject: "S", body: "こんにちは" }).text.endsWith(LEAD_ACK_FOOTER_EN));
});

test("tiếng Nhật: dấu chấm câu 。 không bị coi là link; evil。com vẫn bị chặn", () => {
  const ja = "田中様\n\nお問い合わせありがとうございます。スマホゲーム向けのスキルエフェクト20個について承知しました。参考になるゲームや資料があれば教えてください。1営業日以内にご連絡いたします。\n\nよろしくお願いいたします。";
  assert.ok("draft" in guardAckDraft(j({ lang: "ja", subject: "スキルエフェクトのご依頼", body: ja })));
  assert.ok("reject" in guardAckDraft(j({ lang: "ja", subject: "件名", body: `${ja}\nevil。com` })));
});

test("loại: số điện thoại", () => {
  assert.ok("reject" in guardAckDraft(j({ lang: "en", subject: "Your project", body: `${okBody}\nCall +1 (800) 555-0199` })));
});

test("user message: chỉ báo có chọn budget, không gửi số tiền", () => {
  const u = JSON.parse(buildAckUserMessage({ name: "A", service: "2D Art", budget: "$5k – $20k", message: "hi" }));
  assert.equal(u.budget_selected, "yes");
  assert.doesNotMatch(JSON.stringify(u), /\$/);
});

test("giờ gửi 4–7 phút; còn < 60s thì gửi ngay", () => {
  assert.equal(ackSendAt(0, 0), 4 * 60_000);
  assert.equal(ackSendAt(0, 1), 7 * 60_000);
  assert.equal(ackSendAt(0, 5), 7 * 60_000);
  assert.equal(scheduledAtParam(300_000, 0), new Date(300_000).toISOString());
  assert.equal(scheduledAtParam(300_000, 250_000), null);
});
