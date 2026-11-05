// node --test src/lib/chat-email.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { CHAT_EMAIL_FOOTER, buildChatReplyEmail, chatFrom } from "./chat-email.ts";
import { fromFor, getHrEmailConfig } from "./hr-email.ts";

const cfg = getHrEmailConfig({});

test("buildChatReplyEmail: subject, mọi câu trả lời theo thứ tự, link, footer", () => {
  const m = buildChatReplyEmail({
    visitorName: "Alex",
    staffName: "Tony",
    replies: ["First reply", "Second reply"],
    resumeUrl: "https://tdgamestudio.com/?chat=abc",
  });
  assert.equal(m.subject, "Re: your message to TD Games");
  assert.ok(m.text.startsWith("Hi Alex,"));
  assert.ok(m.text.indexOf("First reply") < m.text.indexOf("Second reply"));
  assert.ok(m.text.includes("Continue the conversation: https://tdgamestudio.com/?chat=abc"));
  assert.ok(m.text.includes("Tony · TD Games"));
  assert.equal(CHAT_EMAIL_FOOTER, "You received this because this address was entered in the chat on tdgamestudio.com");
});

test("buildChatReplyEmail: không có tên → Hi there", () => {
  const m = buildChatReplyEmail({ visitorName: null, staffName: "Tony", replies: ["x"], resumeUrl: "u" });
  assert.ok(m.text.startsWith("Hi there,"));
});

test("chatFrom: khách từ info@, ứng viên như mail tuyển dụng (hiring@)", () => {
  assert.equal(chatFrom(cfg, "client", "Tony"), '"Tony · TD Games" <info@tdgamestudio.com>');
  assert.equal(chatFrom(cfg, "candidate", "Phương"), fromFor(cfg, "Phương"));
  assert.equal(chatFrom(cfg, "client", 'Ev"il <x>'), '"Ev il x · TD Games" <info@tdgamestudio.com>');
  assert.equal(chatFrom(cfg, "client", ""), '"TD Games" <info@tdgamestudio.com>');
});
