// node --test src/lib/hr-freelance.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  checkFreelancePatch,
  filterFreelancers,
  formatRateVnd,
  freelancePatchFields,
  isFreelanceApp,
  parseRateVnd,
  type FreelanceFilter,
} from "./hr-freelance.ts";

test("parseRateVnd: số / có dấu chấm phẩy / đ VNĐ → số; chữ khác, rỗng, quá nhỏ → null", () => {
  assert.equal(parseRateVnd("150000"), 150000);
  assert.equal(parseRateVnd("250.000 VNĐ"), 250000);
  assert.equal(parseRateVnd("150,000đ"), 150000);
  assert.equal(parseRateVnd(150000), 150000);
  assert.equal(parseRateVnd("40 hours"), null);
  assert.equal(parseRateVnd(""), null);
  assert.equal(parseRateVnd("5000"), null);
  assert.equal(parseRateVnd(null), null);
  assert.equal(parseRateVnd(200_000_000), null);
});

test("formatRateVnd", () => {
  assert.equal(formatRateVnd(150000), "150.000đ/giờ");
  assert.equal(formatRateVnd(null), "—");
});

test("isFreelanceApp", () => {
  assert.equal(isFreelanceApp({ work_type: "freelancer" }), true);
  assert.equal(isFreelanceApp({ work_type: "fulltime" }), false);
  assert.equal(isFreelanceApp({}), false);
});

const rows = [
  { id: "a", job_id: "j1", full_name: "Nguyễn Hồ Ngọc Anh", email: "na@x.com", freelance_stage: "new", freelance_level: "junior", rate_vnd_per_hour: 150000, freelance_issue: false, freelance_job_open: true },
  { id: "b", job_id: "j2", full_name: "Đỗ Thạch Lam", email: "lam@x.com", freelance_stage: "new", freelance_level: null, rate_vnd_per_hour: 100000, freelance_issue: false, freelance_job_open: false },
  { id: "c", job_id: "j1", full_name: "Tran Van Linh", email: "linh@x.com", freelance_stage: "collaborated", freelance_level: "senior", rate_vnd_per_hour: null, freelance_issue: true, freelance_job_open: true },
  { id: "d", job_id: "j3", full_name: "Đỗ Thành Đạt", email: "dat@x.com", freelance_stage: "testing", freelance_level: "middle", rate_vnd_per_hour: 250000, freelance_issue: false, freelance_job_open: true },
];
const none: FreelanceFilter = { jobId: null, level: null, stage: null, rateMin: null, rateMax: null, collaborated: false, issue: false, jobNotOpen: false, q: "" };
const ids = (f: Partial<FreelanceFilter>) => filterFreelancers(rows, { ...none, ...f }).map((r) => r.id);

test("filterFreelancers: từng bộ lọc", () => {
  assert.deepEqual(ids({}), ["a", "b", "c", "d"]);
  assert.deepEqual(ids({ jobId: "j1" }), ["a", "c"]);
  assert.deepEqual(ids({ level: "none" }), ["b"]);
  assert.deepEqual(ids({ level: "senior" }), ["c"]);
  assert.deepEqual(ids({ stage: "testing" }), ["d"]);
  assert.deepEqual(ids({ rateMin: 100000, rateMax: 200000 }), ["a", "b"]);
  assert.deepEqual(ids({ rateMin: 200000 }), ["d"]);
  assert.deepEqual(ids({ collaborated: true }), ["c"]);
  assert.deepEqual(ids({ issue: true }), ["c"]);
  assert.deepEqual(ids({ jobNotOpen: true }), ["b"]);
  assert.deepEqual(ids({ q: "ngoc anh" }), ["a"]);
  assert.deepEqual(ids({ q: "DO THANH" }), ["d"]);
  assert.deepEqual(ids({ q: "lam@x" }), ["b"]);
});

const FL = { work_type: "freelancer", status: "freelancer" };
const FT = { work_type: "fulltime", status: "new" };

test("checkFreelancePatch: khoá status, chặn trường freelancer trên đơn fulltime, kiểm giá trị", () => {
  assert.ok(checkFreelancePatch(FL, { status: "rejected" }));
  assert.ok(checkFreelancePatch(FT, { status: "freelancer" }));
  assert.equal(checkFreelancePatch(FT, { status: "reviewing" }), null);
  assert.equal(checkFreelancePatch(FL, { freelance_stage: "talking" }), null);
  assert.ok(checkFreelancePatch(FL, { freelance_stage: "x" }));
  assert.equal(checkFreelancePatch(FL, { freelance_level: "junior" }), null);
  assert.equal(checkFreelancePatch(FL, { freelance_level: null }), null);
  assert.ok(checkFreelancePatch(FL, { freelance_level: "lead" }));
  assert.equal(checkFreelancePatch(FL, { rate_vnd_per_hour: "150.000" }), null);
  assert.equal(checkFreelancePatch(FL, { rate_vnd_per_hour: "" }), null);
  assert.ok(checkFreelancePatch(FL, { rate_vnd_per_hour: "40 hours" }));
  assert.ok(checkFreelancePatch(FL, { freelance_issue: "yes" }));
  assert.ok(checkFreelancePatch(FT, { freelance_level: "junior" }));
  assert.equal(checkFreelancePatch(FL, { convert_work_type: "fulltime" }), null);
  assert.ok(checkFreelancePatch(FL, { convert_work_type: "freelancer" }));
  assert.equal(checkFreelancePatch(FT, { convert_work_type: "freelancer" }), null);
  assert.ok(checkFreelancePatch(FT, { convert_work_type: "x" }));
  assert.ok(checkFreelancePatch(FT, { convert_work_type: "freelancer", status: "new" }));
});

test("freelancePatchFields: map giá trị + 2 chiều đổi hình thức", () => {
  assert.deepEqual(freelancePatchFields({ freelance_stage: "testing", freelance_level: "", rate_vnd_per_hour: "150.000", freelance_issue: true }, { jobOpen: true }), {
    freelance_stage: "testing", freelance_level: null, rate_vnd_per_hour: 150000, freelance_issue: true,
  });
  assert.deepEqual(freelancePatchFields({ rate_vnd_per_hour: "" }, { jobOpen: true }), { rate_vnd_per_hour: null });
  assert.deepEqual(freelancePatchFields({ convert_work_type: "freelancer" }, { jobOpen: false }), {
    work_type: "freelancer", status: "freelancer", freelance_stage: "new", freelance_job_open: false,
  });
  assert.deepEqual(freelancePatchFields({ convert_work_type: "fulltime" }, { jobOpen: true }), { work_type: "fulltime", status: "new" });
  assert.deepEqual(freelancePatchFields({ admin_notes: "x" }, { jobOpen: true }), {});
});
