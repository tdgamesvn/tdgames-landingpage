// node --test src/lib/application-input.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { escapeTelegramHtml, sanitizeApplicationInput } from "./application-input.ts";

const CDN = "cdn.tdgamestudio.com";
const valid = {
  job_id: "11111111-1111-1111-1111-111111111111",
  full_name: "  Nguyễn Văn A ",
  email: "a@b.co",
  work_type: "fulltime",
  cv_url: "https://cdn.tdgamestudio.com/cv/a.pdf",
  portfolio_url: " https://www.behance.net/a ",
  years_experience: 3,
  message: "Xin chào",
};

test("form hợp lệ: giữ đúng các trường, trim chuỗi", () => {
  const r = sanitizeApplicationInput(valid, CDN);
  assert.ok("data" in r);
  assert.equal(r.data.full_name, "Nguyễn Văn A");
  assert.equal(r.data.portfolio_url, "https://www.behance.net/a");
  assert.equal(r.data.years_experience, 3);
  assert.equal(r.data.cv_url, "https://cdn.tdgamestudio.com/cv/a.pdf");
});

test("bỏ mọi trường nội bộ người gửi tự thêm (mass assignment)", () => {
  const r = sanitizeApplicationInput(
    { ...valid, status: "offer", ai_score: 100, admin_notes: "x", test_token: "t", id: "x", rejection_reason: "y", test_review: {} },
    CDN,
  );
  assert.ok("data" in r);
  for (const k of ["status", "ai_score", "admin_notes", "test_token", "id", "rejection_reason", "test_review"]) {
    assert.equal(k in r.data, false, k);
  }
});

test("thiếu trường bắt buộc / email sai / work_type lạ → lỗi", () => {
  for (const bad of [
    { ...valid, full_name: "  " },
    { ...valid, email: "abc" },
    { ...valid, work_type: "ceo" },
    { ...valid, job_id: "" },
    { ...valid, job_id: "not-a-uuid" },
  ]) {
    assert.ok("error" in sanitizeApplicationInput(bad, CDN), JSON.stringify(bad));
  }
});

test("link portfolio/linkedin/website chỉ nhận http(s)", () => {
  for (const k of ["portfolio_url", "linkedin_url", "website_url"]) {
    assert.ok("error" in sanitizeApplicationInput({ ...valid, [k]: "javascript:alert(1)" }, CDN), k);
    assert.ok("error" in sanitizeApplicationInput({ ...valid, [k]: "data:text/html,x" }, CDN), k);
  }
});

test("cv_url chỉ nhận file đã upload lên CDN của mình", () => {
  assert.ok("error" in sanitizeApplicationInput({ ...valid, cv_url: "https://evil.com/a.pdf" }, CDN));
  assert.ok("error" in sanitizeApplicationInput({ ...valid, cv_url: "javascript:alert(1)" }, CDN));
  assert.ok("error" in sanitizeApplicationInput({ ...valid, cv_url: "http://cdn.tdgamestudio.com/a.pdf" }, CDN));
  const r = sanitizeApplicationInput({ ...valid, cv_url: null }, CDN);
  assert.ok("data" in r && r.data.cv_url === null);
});

test("chuỗi rỗng → null, chuỗi quá dài bị cắt, số kinh nghiệm vô lý → null", () => {
  const r = sanitizeApplicationInput({ ...valid, phone: "", message: "x".repeat(20000), years_experience: -5 }, CDN);
  assert.ok("data" in r);
  assert.equal(r.data.phone, null);
  assert.ok((r.data.message as string).length <= 5000);
  assert.equal(r.data.years_experience, null);
});

test("escapeTelegramHtml", () => {
  assert.equal(escapeTelegramHtml(`<b>x</b> & "y"`), "&lt;b&gt;x&lt;/b&gt; &amp; \"y\"");
});
