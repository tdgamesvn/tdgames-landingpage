// node --test src/lib/offer-fallback.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { backupCandidates, leaveAcceptedWarning } from "./offer-fallback.ts";

const OPEN = new Set(["new", "reviewing", "interview"]);
const app = (id: string, status: string, o: Partial<{ job_id: string; work_type: string | null }> = {}) => ({
  id, full_name: `UV ${id}`, status, job_id: o.job_id ?? "j1", work_type: o.work_type === undefined ? "fulltime" : o.work_type,
});

test("backupCandidates: cùng job, bỏ chính hồ sơ + freelancer + job khác; tách Lưu hồ sơ / đang mở", () => {
  const apps = [
    app("me", "offer"),
    app("a", "talent_pool"),
    app("b", "interview"),
    app("c", "rejected"),
    app("d", "talent_pool", { job_id: "j2" }),
    app("e", "new", { work_type: "freelancer" }),
    app("f", "new", { work_type: null }),
  ];
  const r = backupCandidates(apps, { id: "me", job_id: "j1" }, OPEN);
  assert.deepEqual(r.pool.map((x) => x.id), ["a"]);
  assert.deepEqual(r.open.map((x) => x.id), ["b", "f"]);
});

test("backupCandidates: không có ai → hai danh sách rỗng", () => {
  const r = backupCandidates([app("me", "offer")], { id: "me", job_id: "j1" }, OPEN);
  assert.deepEqual(r, { pool: [], open: [] });
});

test("leaveAcceptedWarning: chỉ khi rời Đã nhận; nêu onboard, hoa hồng chưa duyệt, khoản đã duyệt", () => {
  assert.equal(leaveAcceptedWarning("pending", "declined"), null);
  assert.equal(leaveAcceptedWarning("accepted", "accepted"), null);
  assert.equal(leaveAcceptedWarning(null, "accepted"), null);
  const w = leaveAcceptedWarning("accepted", "declined")!;
  assert.match(w, /Từ chối/);
  assert.match(w, /onboard/i);
  assert.match(w, /chưa duyệt/);
  assert.match(w, /đã duyệt/);
  assert.match(leaveAcceptedWarning("accepted", "pending")!, /Chờ trả lời/);
});

test("backupCandidates: bỏ người bị chặn (blocked)", () => {
  const apps = [app("me", "offer"), { ...app("x", "talent_pool"), blocked: true }, app("y", "talent_pool")];
  assert.deepEqual(backupCandidates(apps, { id: "me", job_id: "j1" }, OPEN).pool.map((a) => a.id), ["y"]);
});
