// node --test src/lib/job-posting.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  OFFICE_STREET,
  employmentTypeOf,
  jobDescriptionHtml,
  jobPostingJsonLd,
  jobStreetAddress,
  parseSalaryRangeVnd,
} from "./job-posting.ts";

test("parseSalaryRangeVnd: nhiều mức → min của mọi mức, max của mọi mức", () => {
  assert.deepEqual(parseSalaryRangeVnd("Junior: 10–15 triệu/tháng | Senior: 15–20 triệu/tháng + Thưởng dự án"), {
    min: 10_000_000,
    max: 20_000_000,
  });
  assert.deepEqual(parseSalaryRangeVnd("Fresher: 8–12 triệu/tháng | Junior: 12–15 triệu/tháng"), {
    min: 8_000_000,
    max: 15_000_000,
  });
});

test("parseSalaryRangeVnd: gạch nối thường, khoảng trắng, 'tr', số lẻ, 1 mức", () => {
  assert.deepEqual(parseSalaryRangeVnd("10 - 15 tr/tháng"), { min: 10_000_000, max: 15_000_000 });
  assert.deepEqual(parseSalaryRangeVnd("Từ 12,5 triệu"), { min: 12_500_000, max: 12_500_000 });
  assert.deepEqual(parseSalaryRangeVnd("10 đến 18 triệu"), { min: 10_000_000, max: 18_000_000 });
});

test("parseSalaryRangeVnd: không có số kèm triệu → null", () => {
  assert.equal(parseSalaryRangeVnd("Thỏa thuận theo năng lực + thưởng hiệu quả dự án"), null);
  assert.equal(parseSalaryRangeVnd("Lương cứng: Thoả thuận theo năng lực + Hoa hồng/Bonus theo doanh số"), null);
  assert.equal(parseSalaryRangeVnd("Competitive"), null);
  assert.equal(parseSalaryRangeVnd("Thưởng 2 tháng lương, 505 Minh Khai"), null);
  assert.equal(parseSalaryRangeVnd(""), null);
  assert.equal(parseSalaryRangeVnd(null), null);
});

test("employmentTypeOf", () => {
  assert.equal(employmentTypeOf("fulltime"), "FULL_TIME");
  assert.equal(employmentTypeOf("parttime"), "PART_TIME");
  assert.equal(employmentTypeOf("freelancer"), "CONTRACTOR");
  assert.equal(employmentTypeOf("remote"), undefined);
});

test("jobStreetAddress: tách phần đường, chỉ 'Hà Nội' → địa chỉ văn phòng", () => {
  assert.equal(
    jobStreetAddress("Hà Nội: Toà Hoà Bình Green City, 505 Minh Khai, Phường Vĩnh Tuy, Hà Nội"),
    "Toà Hoà Bình Green City, 505 Minh Khai, Phường Vĩnh Tuy",
  );
  assert.equal(jobStreetAddress("Hà Nội"), OFFICE_STREET);
  assert.equal(jobStreetAddress("Remote"), undefined);
});

test("jobDescriptionHtml: escape HTML, bỏ danh sách rỗng", () => {
  const html = jobDescriptionHtml({
    title: "X",
    slug: "x",
    summary: "Tóm <b>tắt</b>",
    responsibilities: ["Vẽ nhân vật"],
    requirements: [],
  });
  assert.equal(html, "<p>Tóm &lt;b&gt;tắt&lt;/b&gt;</p><h3>Trách nhiệm</h3><ul><li>Vẽ nhân vật</li></ul>");
});

test("jobPostingJsonLd: đủ field, baseSalary VND/MONTH, không validThrough", () => {
  const ld = jobPostingJsonLd({
    title: "2D Game Artist",
    slug: "2d-game-artist",
    summary: "Vẽ 2D",
    type: "fulltime",
    location: "Hà Nội: Toà Hoà Bình Green City, 505 Minh Khai, Phường Vĩnh Tuy, Hà Nội",
    salary: "Junior: 10–15 triệu/tháng | Senior: 15–20 triệu/tháng",
    created_at: "2026-05-24T00:50:41.971173+00:00",
  });
  assert.equal(ld["@type"], "JobPosting");
  assert.equal(ld.datePosted, "2026-05-24T00:50:41.971Z");
  assert.equal(ld.employmentType, "FULL_TIME");
  assert.equal(ld.directApply, true);
  assert.equal(ld.hiringOrganization["@id"], "https://tdgamestudio.com/#organization");
  assert.equal(ld.jobLocation.address.addressCountry, "VN");
  assert.equal(ld.url, "https://tdgamestudio.com/careers/2d-game-artist");
  assert.deepEqual(ld.baseSalary?.value, {
    "@type": "QuantitativeValue",
    minValue: 10_000_000,
    maxValue: 20_000_000,
    unitText: "MONTH",
  });
  assert.equal(ld.baseSalary?.currency, "VND");
  assert.ok(!("validThrough" in ld));
});

test("jobPostingJsonLd: lương thoả thuận → không có baseSalary", () => {
  const ld = jobPostingJsonLd({ title: "PA", slug: "pa", type: "fulltime", salary: "Thỏa thuận" });
  assert.ok(!("baseSalary" in ld));
});
