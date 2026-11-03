// node --test src/lib/hr-duplicates.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  addMonthsVn,
  classifyDuplicate,
  firstReferral,
  normalizeEmail,
  normalizePhone,
  sameRole,
  type PriorApp,
} from "./hr-duplicates.ts";

const NOW = "2026-11-03T03:00:00.000Z";
const JOB = "11111111-1111-1111-1111-111111111111";
const OTHER_JOB = "22222222-2222-2222-2222-222222222222";

function monthsAgo(n: number): string {
  const d = new Date(NOW);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString();
}

function prior(p: Partial<PriorApp>): PriorApp {
  return {
    id: "p1",
    job_id: JOB,
    job_title: "2D Artist",
    email: "a@x.com",
    phone: null,
    status: "rejected",
    status_kind: "lost",
    status_changed_at: monthsAgo(2),
    created_at: monthsAgo(3),
    referred_by: null,
    assignee_user_id: null,
    duplicate_kind: null,
    ...p,
  };
}

const input = { email: "a@x.com", phone: null, job_id: JOB, job_title: "2D Artist", now: NOW };

test("normalizeEmail: trim + lower-case; rỗng → null", () => {
  assert.equal(normalizeEmail(" A@X.com "), "a@x.com");
  assert.equal(normalizeEmail(""), null);
  assert.equal(normalizeEmail(null), null);
});

test("normalizePhone: +84 / dấu chấm / 84 cùng ra 0…; ngắn → null", () => {
  assert.equal(normalizePhone("+84 912 345 678"), "0912345678");
  assert.equal(normalizePhone("0912.345.678"), "0912345678");
  assert.equal(normalizePhone("84912345678"), "0912345678");
  assert.equal(normalizePhone("12345"), null);
  assert.equal(normalizePhone(null), null);
});

test("addMonthsVn: cộng tháng theo ngày giờ VN", () => {
  assert.equal(addMonthsVn("2026-05-02T20:00:00Z", 6), "2026-11-03");
  assert.equal(addMonthsVn("2026-08-31T03:00:00Z", 6), "2027-02-28");
});

test("sameRole: cùng id, hoặc tiêu đề trim/lower giống hệt", () => {
  assert.equal(sameRole({ job_id: JOB, job_title: "A" }, { job_id: JOB, job_title: "B" }), true);
  assert.equal(sameRole({ job_id: JOB, job_title: "2D Artist " }, { job_id: OTHER_JOB, job_title: "2d artist" }), true);
  assert.equal(sameRole({ job_id: JOB, job_title: "2D Artist" }, { job_id: OTHER_JOB, job_title: "UI Artist" }), false);
  assert.equal(sameRole({ job_id: JOB, job_title: null }, { job_id: OTHER_JOB, job_title: null }), false);
});

test("auto-reject: trùng email, cùng job, rejected 2 tháng trước", () => {
  const p = prior({});
  const r = classifyDuplicate(input, [p]);
  assert.equal(r?.kind, "auto_rejected");
  assert.equal(r?.prior.id, "p1");
  assert.equal(r?.rejectedAt, p.status_changed_at);
  assert.equal(r?.reapplyFrom, addMonthsVn(p.status_changed_at!, 6));
});

test("auto-reject khớp email bất kể hoa thường/khoảng trắng", () => {
  const r = classifyDuplicate({ ...input, email: " A@X.COM " }, [prior({})]);
  assert.equal(r?.kind, "auto_rejected");
});

test("chỉ trùng SĐT → returning, không auto-reject", () => {
  const r = classifyDuplicate(
    { ...input, email: "b@x.com", phone: "+84 912 345 678" },
    [prior({ phone: "0912345678" })],
  );
  assert.equal(r?.kind, "returning");
});

test("rejected 7 tháng trước → returning", () => {
  const r = classifyDuplicate(input, [prior({ status_changed_at: monthsAgo(7), created_at: monthsAgo(8) })]);
  assert.equal(r?.kind, "returning");
});

test("talent_pool cùng job 1 tháng → returning", () => {
  const r = classifyDuplicate(input, [prior({ status: "talent_pool", status_changed_at: monthsAgo(1) })]);
  assert.equal(r?.kind, "returning");
});

test("cùng job đang open → open_duplicate", () => {
  const r = classifyDuplicate(input, [prior({ status: "test", status_kind: "open", status_changed_at: null })]);
  assert.equal(r?.kind, "open_duplicate");
});

test("job khác, rejected 1 tháng → returning", () => {
  const r = classifyDuplicate(input, [prior({ job_id: OTHER_JOB, job_title: "UI Artist", status_changed_at: monthsAgo(1) })]);
  assert.equal(r?.kind, "returning");
});

test("đơn auto_rejected không đẩy mốc: vẫn tính từ lần trượt thật", () => {
  const real = prior({ id: "real", status_changed_at: monthsAgo(5), created_at: monthsAgo(5) });
  const auto = prior({ id: "auto", status_changed_at: monthsAgo(1), created_at: monthsAgo(1), duplicate_kind: "auto_rejected" });
  const r = classifyDuplicate(input, [auto, real]);
  assert.equal(r?.kind, "auto_rejected");
  assert.equal(r?.prior.id, "real");
  assert.equal(r?.rejectedAt, real.status_changed_at);
});

test("chỉ còn đơn auto_rejected (lần trượt thật đã quá 6 tháng) → returning", () => {
  const real = prior({ id: "real", status_changed_at: monthsAgo(7), created_at: monthsAgo(7) });
  const auto = prior({ id: "auto", status_changed_at: monthsAgo(1), created_at: monthsAgo(1), duplicate_kind: "auto_rejected" });
  assert.equal(classifyDuplicate(input, [auto, real])?.kind, "returning");
});

test("reject → mở lại → reject lần nữa: mốc = status_changed_at mới nhất", () => {
  const r = classifyDuplicate(input, [prior({ status_changed_at: monthsAgo(1), created_at: monthsAgo(8) })]);
  assert.equal(r?.kind, "auto_rejected");
});

test("rejected chưa có status_changed_at → dùng created_at", () => {
  const r = classifyDuplicate(input, [prior({ status_changed_at: null, created_at: monthsAgo(2) })]);
  assert.equal(r?.kind, "auto_rejected");
  assert.equal(r?.rejectedAt, monthsAgo(2));
});

test("không khớp → null; priors của người khác bị lọc", () => {
  assert.equal(classifyDuplicate(input, []), null);
  assert.equal(classifyDuplicate(input, [prior({ email: "other@x.com" })]), null);
});

test("returning chọn hồ sơ cùng vị trí mới nhất trước hồ sơ mới nhất khác vị trí", () => {
  const same = prior({ id: "same", status_changed_at: monthsAgo(9), created_at: monthsAgo(9) });
  const other = prior({ id: "other", job_id: OTHER_JOB, job_title: "UI", created_at: monthsAgo(1), status_changed_at: monthsAgo(1) });
  assert.equal(classifyDuplicate(input, [other, same])?.prior.id, "same");
});

test("firstReferral: hồ sơ có ref sớm nhất trong 6 tháng", () => {
  const a = prior({ id: "a", referred_by: "mai-ha", created_at: monthsAgo(3) });
  const c = prior({ id: "c", referred_by: "thuy", created_at: monthsAgo(1) });
  assert.equal(firstReferral({ email: "a@x.com", phone: null, now: NOW }, [c, a])?.id, "a");
});

test("firstReferral: ref quá 6 tháng → null; chỉ khớp SĐT không tính (chống mạo danh bằng SĐT)", () => {
  assert.equal(firstReferral({ email: "a@x.com", phone: null, now: NOW }, [prior({ referred_by: "x", created_at: monthsAgo(7) })]), null);
  const p = prior({ email: "z@x.com", phone: "0912345678", referred_by: "x", created_at: monthsAgo(1) });
  assert.equal(firstReferral({ email: "a@x.com", phone: "84912345678", now: NOW }, [p]), null);
});

// ── Nội dung tin báo (Task 5) ──
import {
  askHrToTellReferrerText,
  duplicateNoticeLine,
  referrerAutoRejectText,
  referrerChanged,
  referrerTakenText,
  teamAutoRejectText,
  formatDateVnShort,
} from "./hr-duplicates.ts";

test("referrerChanged: so theo chủ mã; tự nộp không mã vẫn chuyển cho người đầu", () => {
  assert.equal(referrerChanged("u:1", "u:1"), false);
  assert.equal(referrerChanged("u:2", "u:1"), true);
  assert.equal(referrerChanged(null, "u:1"), true);
  assert.equal(referrerChanged("u:2", null), false);
  assert.equal(referrerChanged(null, null), false);
});

test("formatDateVnShort: ISO → dd/mm/yyyy giờ VN; YYYY-MM-DD giữ ngày", () => {
  assert.equal(formatDateVnShort("2026-05-02T20:00:00Z"), "03/05/2026");
  assert.equal(formatDateVnShort("2027-03-02"), "02/03/2027");
});

test("referrerAutoRejectText: có tên, vị trí, ngày được giới thiệu lại; không lộ ngày nộp cũ / kết quả", () => {
  const t = referrerAutoRejectText({ name: "Lan", jobTitle: "2D Artist", reapplyFrom: "02/03/2027" });
  for (const s of ["Lan", "2D Artist", "02/03/2027"]) assert.ok(t.includes(s), s);
  assert.ok(!/trượt|chưa phù hợp|không phù hợp/i.test(t));
});

test("teamAutoRejectText: bắt đầu bằng 🔁 Tự động từ chối, có link hồ sơ cũ", () => {
  const t = teamAutoRejectText({ name: "Lan", jobTitle: "2D Artist", rejectedAt: "02/09/2026", priorUrl: "https://x/hr?app=1", mailSent: true });
  assert.ok(t.startsWith("🔁 Tự động từ chối"));
  assert.ok(t.includes("https://x/hr?app=1"));
});

test("referrerTakenText + askHrToTellReferrerText + duplicateNoticeLine", () => {
  const taken = referrerTakenText({ name: "Lan", jobTitle: "UI" });
  assert.ok(taken.includes("Lan") && taken.includes("UI"));
  const ask = askHrToTellReferrerText({ referrer: "thuy-headhunt", contact: "0912345678", base: "BASE" });
  assert.ok(ask.startsWith("BASE"));
  assert.ok(ask.includes("thuy-headhunt") && ask.includes("0912345678"));
  assert.ok(!askHrToTellReferrerText({ referrer: "x", contact: null, base: "B" }).includes("null"));
  // Kênh Discord chung: không lộ vị trí / trạng thái / ngày của hồ sơ cũ — chỉ báo có, xem chi tiết trên /hr.
  const line = duplicateNoticeLine({ kind: "returning" });
  assert.ok(line.includes("Đã từng ứng tuyển") && line.includes("/hr"));
  assert.ok(duplicateNoticeLine({ kind: "open_duplicate" }).includes("trùng"));
});

// ── Final review fixes ──
test("firstReferral: hồ sơ thừa kế mã (nộp lại trong hạn) không gia hạn quyền của người đầu", () => {
  const a = prior({ id: "a", referred_by: "mai-ha", created_at: monthsAgo(10), status_changed_at: monthsAgo(10) });
  const inherited = prior({ id: "inh", referred_by: "mai-ha", created_at: monthsAgo(5), status_changed_at: monthsAgo(5) });
  assert.equal(firstReferral({ email: "a@x.com", phone: null, now: NOW }, [inherited, a]), null);
});

test("firstReferral: đơn auto_rejected không giữ quyền giới thiệu", () => {
  const auto = prior({ id: "auto", referred_by: "thuy", created_at: monthsAgo(1), duplicate_kind: "auto_rejected" });
  assert.equal(firstReferral({ email: "a@x.com", phone: null, now: NOW }, [auto]), null);
});

test("firstReferral: quyền người đầu hết hạn → người giới thiệu sau (còn hạn) giữ", () => {
  const a = prior({ id: "a", referred_by: "mai-ha", created_at: monthsAgo(10) });
  const c = prior({ id: "c", referred_by: "thuy", created_at: monthsAgo(2) });
  assert.equal(firstReferral({ email: "a@x.com", phone: null, now: NOW }, [a, c])?.id, "c");
});

import { referralDecision } from "./hr-duplicates.ts";

test("referralDecision: auto-reject không có người giới thiệu đầu → vẫn báo B", () => {
  assert.deepEqual(referralDecision({ dupKind: "auto_rejected", submittedOwnerKey: "u:b", firstOwnerKey: null }), {
    overwrite: false, notify: "auto_rejected", needsManualNotice: false,
  });
});

test("referralDecision: B là người ngoài → cần HR báo tay; B có tài khoản → không", () => {
  assert.equal(referralDecision({ dupKind: "auto_rejected", submittedOwnerKey: "r:x", firstOwnerKey: "u:a" }).needsManualNotice, true);
  assert.equal(referralDecision({ dupKind: "auto_rejected", submittedOwnerKey: "c:la", firstOwnerKey: null }).needsManualNotice, true);
  assert.equal(referralDecision({ dupKind: "returning", submittedOwnerKey: "u:b", firstOwnerKey: "u:a" }).needsManualNotice, false);
});

test("referralDecision: chuyển quyền khi khác người đầu; cùng người / không mã auto-reject → không báo", () => {
  assert.deepEqual(referralDecision({ dupKind: "returning", submittedOwnerKey: "u:b", firstOwnerKey: "u:a" }), {
    overwrite: true, notify: "taken", needsManualNotice: false,
  });
  assert.deepEqual(referralDecision({ dupKind: "returning", submittedOwnerKey: null, firstOwnerKey: "u:a" }), {
    overwrite: true, notify: null, needsManualNotice: false,
  });
  assert.deepEqual(referralDecision({ dupKind: "auto_rejected", submittedOwnerKey: "u:a", firstOwnerKey: "u:a" }), {
    overwrite: false, notify: null, needsManualNotice: false,
  });
  assert.deepEqual(referralDecision({ dupKind: null, submittedOwnerKey: "u:b", firstOwnerKey: null }), {
    overwrite: false, notify: null, needsManualNotice: false,
  });
});

// ── Minor còn tồn (2026-11-03, sếp "Fix nốt") ──
test("normalizePhone: số VN 9 chữ số thiếu 0 đầu và dạng +84 0… về 0…; số nước ngoài giữ nguyên", () => {
  assert.equal(normalizePhone("912 345 678"), "0912345678");
  assert.equal(normalizePhone("+84 0912 345 678"), "0912345678");
  assert.equal(normalizePhone("+34 678 567 960"), "34678567960");
  assert.equal(normalizePhone("123456789"), "123456789");
});

test("normalizeEmail: bỏ tab/NBSP đầu cuối", () => {
  assert.equal(normalizeEmail(" \tA@x.com "), "a@x.com");
});

test("sameRole: gộp khoảng trắng giữa + chuẩn Unicode NFC", () => {
  assert.equal(sameRole({ job_id: JOB, job_title: "2D  Artist" }, { job_id: OTHER_JOB, job_title: "2d artist" }), true);
  const nfd = "Họa sĩ 2D".normalize("NFD");
  assert.equal(sameRole({ job_id: JOB, job_title: nfd }, { job_id: OTHER_JOB, job_title: "Họa sĩ 2D" }), true);
});

test("returning: duplicate_of ưu tiên hồ sơ thật, không trỏ vào đơn auto_rejected", () => {
  const real = prior({ id: "real", job_id: OTHER_JOB, job_title: "UI", status: "rejected", created_at: monthsAgo(3), status_changed_at: monthsAgo(3) });
  const auto = prior({ id: "auto", job_id: OTHER_JOB, job_title: "UI", status: "rejected", created_at: monthsAgo(1), status_changed_at: monthsAgo(1), duplicate_kind: "auto_rejected" });
  assert.equal(classifyDuplicate(input, [auto, real])?.prior.id, "real");
});

test("teamAutoRejectText: nói đúng mail đã gửi hay chưa", () => {
  const base = { name: "Lan", jobTitle: "2D", rejectedAt: "02/09/2026", priorUrl: "u" };
  assert.ok(teamAutoRejectText({ ...base, mailSent: true }).includes("Đã gửi mail"));
  const no = teamAutoRejectText({ ...base, mailSent: false });
  assert.ok(!no.includes("Đã gửi mail"));
  assert.ok(no.includes("Chưa gửi được mail"));
});

test("teamAutoRejectText: ghi mã người giới thiệu lần này (để lại dấu vết), không có thì thôi", () => {
  const base = { name: "Lan", jobTitle: "2D", rejectedAt: "02/09/2026", priorUrl: "u", mailSent: true };
  assert.ok(teamAutoRejectText({ ...base, submittedCode: "zz-b" }).includes("zz-b"));
  assert.ok(!teamAutoRejectText({ ...base, submittedCode: null }).includes("giới thiệu"));
});
