// node --test src/lib/chat-ai-core.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildPrompt, estimateCostUsd, guardDraft, parseAiReply, worthDrafting, type AiDraft } from "./chat-ai-core.ts";

const kb = [
  { id: "a", title: "Revisions", content: "Three revision rounds per asset. Quote within 24–48h via /contact." },
  { id: "b", title: "Contact", content: "Email: info@tdgamestudio.com" },
];
const jobs = [{ title: "2D Animator", slug: "2d-animator", type: "Full-time", location: "Hanoi", level: null, summary: null }];
const { refs, user } = buildPrompt({
  audience: "client",
  kb,
  jobs,
  history: [{ sender: "visitor", kind: "text", body: "How many revisions?" }],
});
const d = (p: Partial<AiDraft>): AiDraft => ({ answer: "", sources: ["K1"], needsHuman: false, confidence: "high", ...p });

test("buildPrompt đánh mã K/J và bọc hội thoại", () => {
  assert.deepEqual([...refs.keys()], ["K1", "K2", "J1"]);
  assert.match(user, /\[J1\] 2D Animator — Full-time, Hanoi\. Apply: \/careers\/2d-animator/);
  assert.match(user, /<conversation>\nVISITOR: How many revisions\?\n<\/conversation>/);
});

test("parseAiReply", () => {
  assert.deepEqual(parseAiReply('xx {"answer":" Hi ","sources":["K1"],"needs_human":false,"confidence":"high"} yy'), {
    answer: "Hi",
    sources: ["K1"],
    needsHuman: false,
    confidence: "high",
  });
  assert.equal(parseAiReply("no json"), null);
  assert.equal(parseAiReply('{"answer": 3}'), null);
  // Thiếu needs_human → mặc định cần người; confidence lạ → low.
  assert.deepEqual(parseAiReply('{"answer":"a","confidence":"x"}'), { answer: "a", sources: [], needsHuman: true, confidence: "low" });
});

test("guardDraft: câu trả lời đúng dữ liệu → không cảnh báo", () => {
  assert.deepEqual(guardDraft(d({ answer: "You get a quote within 24–48h — send a brief via /contact or info@tdgamestudio.com." }), refs, ""), []);
  assert.deepEqual(guardDraft(d({ answer: "Apply here: /careers/2d-animator", sources: ["J1"] }), refs, ""), []);
});

test("guardDraft: bắt số / email / link / nguồn bịa", () => {
  assert.deepEqual(guardDraft(d({ answer: "A character costs $500 and takes 10 days." }), refs, ""), ["unverified_numbers:500,10"]);
  assert.deepEqual(guardDraft(d({ answer: "Mail sales@tdgamestudio.com" }), refs, ""), ["unverified_email"]);
  assert.deepEqual(guardDraft(d({ answer: "See /pricing" }), refs, ""), ["unverified_link:/pricing"]);
  assert.deepEqual(guardDraft(d({ answer: "Hi", sources: [] }), refs, ""), ["no_source"]);
  assert.deepEqual(guardDraft(d({ answer: "Hi", sources: ["K9"] }), refs, ""), ["unknown_source", "no_source"]);
  assert.ok(guardDraft(d({ answer: "We are working on ORCA." }), refs, "").includes("nda_mention"));
  // Số khách tự nói ra thì được nhắc lại.
  assert.deepEqual(guardDraft(d({ answer: "For your 40 characters, send a brief." }), refs, "I need 40 characters"), []);
  // "24/7", "and/or" không bị coi là link.
  assert.deepEqual(guardDraft(d({ answer: "Unity/Cocos and/or Spine" }), refs, ""), []);
  // Dấu phân cách nghìn kiểu Việt: "1.000 USD" khớp "USD 1,000" trong kho; số khác vẫn bị bắt.
  const priced = new Map([["K1", "Typical projects start from around USD 1,000."]]);
  assert.deepEqual(guardDraft(d({ answer: "Dự án thường từ khoảng 1.000 USD." }), priced, ""), []);
  assert.deepEqual(guardDraft(d({ answer: "Dự án từ 2.000 USD." }), priced, ""), ["unverified_numbers:2.000"]);
});

test("worthDrafting bỏ tin rác", () => {
  for (const s of ["ok", "Thanks!", "👍", "?", "hi"]) assert.equal(worthDrafting(s), false, s);
  for (const s of ["How much for 10 icons?", "Bạn có tuyển animator không"]) assert.equal(worthDrafting(s), true, s);
});

test("estimateCostUsd theo giá Sonnet 5.5", () => {
  assert.equal(estimateCostUsd(1_000_000, 0), 2);
  assert.equal(estimateCostUsd(0, 1_000_000), 10);
  assert.ok(Math.abs(estimateCostUsd(4000, 300) - 0.011) < 1e-9);
});
