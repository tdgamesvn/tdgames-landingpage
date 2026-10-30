// node --test src/lib/hr-close-out.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CLOSE_OUT_MAX,
  TALENT_POOL_STATUS,
  closeOutCandidates,
  closeOutSkipReason,
  closeOutSummary,
  parseCloseOutBody,
} from "./hr-close-out.ts";
import { HOLD_REPLY_DAYS, holdReplyBy } from "./hr-email-base.ts";
import type { ScopeInput } from "./hr-scope.ts";

const statuses: ScopeInput["statuses"] = [
  { key: "new", position: 10, kind: "open" },
  { key: "reviewing", position: 20, kind: "open" },
  { key: "interview", position: 50, kind: "open" },
  { key: "offer", position: 60, kind: "won" },
  { key: "rejected", position: 70, kind: "lost" },
  { key: TALENT_POOL_STATUS, position: 75, kind: "lost" },
];
const hr: ScopeInput = { role: "hr", userId: "u1", leaderJobIds: [], statuses };
const leader: ScopeInput = { role: "leader", userId: "u2", leaderJobIds: ["j1"], statuses };

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

test("hằng số: talent_pool, tối đa 100, hạn phản hồi 14 ngày", () => {
  assert.equal(TALENT_POOL_STATUS, "talent_pool");
  assert.equal(CLOSE_OUT_MAX, 100);
  assert.equal(HOLD_REPLY_DAYS, 14);
});

test("holdReplyBy: hôm nay theo giờ VN + 14 ngày, dạng 'Thứ Sáu 13/11/2026'", () => {
  // 30/10/2026 10:00 giờ VN → 13/11/2026 (Thứ Sáu).
  assert.equal(holdReplyBy(new Date("2026-10-30T03:00:00Z")), "Thứ Sáu 13/11/2026");
  // 23:30 UTC ngày 30/10 = 06:30 ngày 31/10 giờ VN → 14/11 (Thứ Bảy), không phải 13/11.
  assert.equal(holdReplyBy(new Date("2026-10-30T23:30:00Z")), "Thứ Bảy 14/11/2026");
  // 16:59 UTC 31/12 = 23:59 VN cùng ngày → qua năm mới.
  assert.equal(holdReplyBy(new Date("2026-12-31T16:59:00Z")), "Thứ Năm 14/01/2027");
});

test("parseCloseOutBody: hợp lệ, gộp trùng", () => {
  assert.deepEqual(parseCloseOutBody({ application_ids: [ID(1), ID(2), ID(1)], send_mail: true }), {
    ids: [ID(1), ID(2)],
    sendMail: true,
  });
  assert.deepEqual(parseCloseOutBody({ application_ids: [ID(3)], send_mail: false }), { ids: [ID(3)], sendMail: false });
});

test("parseCloseOutBody: lỗi rõ ràng", () => {
  const err = (b: unknown) => {
    const r = parseCloseOutBody(b);
    assert.ok("error" in r, JSON.stringify(b));
    return r.error;
  };
  assert.match(err(null), /không hợp lệ/);
  assert.match(err([]), /không hợp lệ/);
  assert.match(err({ application_ids: [], send_mail: true }), /1 đến 100/);
  assert.match(err({ application_ids: "x", send_mail: true }), /1 đến 100/);
  assert.match(err({ application_ids: Array.from({ length: 101 }, (_, i) => ID(i)), send_mail: true }), /1 đến 100/);
  assert.match(err({ application_ids: ["abc"], send_mail: true }), /Mã hồ sơ/);
  assert.match(err({ application_ids: [ID(1)] }), /send_mail/);
  assert.match(err({ application_ids: [ID(1)], send_mail: "true" }), /send_mail/);
});

const app = (o: Partial<{ id: string; job_id: string; status: string; full_name: string | null; email: string | null; created_at: string; offer_status: string | null }>) => ({
  id: ID(1),
  job_id: "j1",
  status: "new",
  full_name: "Lan",
  email: "lan@x.vn",
  created_at: "2026-10-20T00:00:00Z",
  offer_status: null,
  ...o,
});

test("closeOutCandidates: chỉ hồ sơ của job, status kind open, trong phạm vi; cũ trước; có email hợp lệ không", () => {
  const apps = [
    app({ id: ID(1), created_at: "2026-10-22T00:00:00Z" }),
    app({ id: ID(2), status: "interview", email: "sai-email", created_at: "2026-10-21T00:00:00Z" }),
    app({ id: ID(3), status: "offer" }),
    app({ id: ID(4), status: "rejected" }),
    app({ id: ID(5), status: TALENT_POOL_STATUS }),
    app({ id: ID(6), job_id: "j2" }),
    app({ id: ID(7), status: "status_da_xoa" }),
    app({ id: ID(8), full_name: null, email: null, created_at: "2026-10-23T00:00:00Z" }),
  ];
  const rows = closeOutCandidates(apps, { jobId: "j1", scope: hr });
  assert.deepEqual(rows, [
    { id: ID(2), name: "Lan", status: "interview", created_at: "2026-10-21T00:00:00Z", has_email: false },
    { id: ID(1), name: "Lan", status: "new", created_at: "2026-10-22T00:00:00Z", has_email: true },
    { id: ID(8), name: "", status: "new", created_at: "2026-10-23T00:00:00Z", has_email: false },
  ]);
  // Loại trừ (vd. ứng viên vừa nhận offer).
  assert.deepEqual(closeOutCandidates(apps, { jobId: "j1", scope: hr, excludeId: ID(1) }).map((r) => r.id), [ID(2), ID(8)]);
  // Leader chỉ thấy job mình phụ trách.
  assert.equal(closeOutCandidates(apps, { jobId: "j2", scope: leader }).length, 0);
  assert.equal(closeOutCandidates(apps, { jobId: "j1", scope: leader }).length, 3);
});

test("closeOutSkipReason: hồ sơ phải thuộc job, trong phạm vi, status kind open", () => {
  const opts = { jobId: "j1", scope: leader };
  assert.equal(closeOutSkipReason(app({}), opts), null);
  assert.equal(closeOutSkipReason(undefined, opts), "Không tìm thấy hồ sơ");
  assert.equal(closeOutSkipReason(app({ job_id: "j2" }), { jobId: "j2", scope: leader }), "Không tìm thấy hồ sơ");
  // Leader thấy hồ sơ job khác của mình? Không → "không tìm thấy"; HR thấy → "không thuộc job này".
  assert.equal(closeOutSkipReason(app({ job_id: "j2" }), opts), "Không tìm thấy hồ sơ");
  assert.equal(closeOutSkipReason(app({ job_id: "j2" }), { jobId: "j1", scope: hr }), "Hồ sơ không thuộc job này");
  assert.equal(closeOutSkipReason(app({ status: "offer" }), opts), "Hồ sơ không còn ở trạng thái đang mở");
  assert.equal(closeOutSkipReason(app({ status: TALENT_POOL_STATUS }), opts), "Hồ sơ không còn ở trạng thái đang mở");
});

test("closeOutSummary: 1 dòng Discord, không tag", () => {
  const s = closeOutSummary({ actor: "Phương", job: "2D Artist", mailed: 3, moved: 4 });
  assert.equal(s, "📮 Phương báo vị trí đã tuyển đủ — 2D Artist: gửi mail 3 ứng viên, chuyển 4 hồ sơ sang Lưu hồ sơ");
  assert.ok(!s.includes("@"));
});
