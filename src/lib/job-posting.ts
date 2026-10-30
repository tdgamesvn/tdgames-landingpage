// JSON-LD JobPosting cho trang /careers/[slug]. Hàm thuần — test: node --test src/lib/job-posting.test.ts
import { ORG_ID, ORG_LOGO, SITE_URL, absoluteUrl, toIsoDate } from "./json-ld.ts";

/** Các field của bảng `jobs` mà JobPosting cần (khớp type Job ở admin/_lib/types). */
export type JobPostingInput = {
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  type?: string | null;
  location?: string | null;
  salary?: string | null;
  image_url?: string | null;
  responsibilities?: string[] | null;
  requirements?: string[] | null;
  nice_to_have?: string[] | null;
  skills?: string[] | null;
  created_at?: string | null;
};

/**
 * "Junior: 10–15 triệu/tháng | Senior: 15–20 triệu/tháng" → { min: 10e6, max: 20e6 } (VND/tháng).
 * Nhiều mức → min của mọi mức, max của mọi mức. Chỉ nhận số đi kèm "triệu"/"tr";
 * không có số nào ("Thoả thuận", "Competitive") → null (không bịa baseSalary).
 */
export function parseSalaryRangeVnd(salary: string | null | undefined): { min: number; max: number } | null {
  if (!salary) return null;
  const num = String.raw`(\d+(?:[.,]\d+)?)`;
  const re = new RegExp(`${num}(?:\\s*(?:[–—-]|đến)\\s*${num})?\\s*(?:triệu|tr(?![a-zà-ỹ]))`, "giu");
  const values: number[] = [];
  for (const m of salary.matchAll(re)) {
    for (const raw of [m[1], m[2]]) {
      if (!raw) continue;
      const n = Number(raw.replace(",", "."));
      if (Number.isFinite(n) && n > 0) values.push(Math.round(n * 1_000_000));
    }
  }
  if (!values.length) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** jobs.type → schema.org employmentType. "remote" không nói rõ hình thức → bỏ trống. */
export function employmentTypeOf(type: string | null | undefined): string | undefined {
  switch (type) {
    case "fulltime":
      return "FULL_TIME";
    case "parttime":
      return "PART_TIME";
    case "freelancer":
      return "CONTRACTOR";
    default:
      return undefined;
  }
}

/** Địa chỉ văn phòng (trùng Organization ở root layout) — dùng khi job chỉ ghi "Hà Nội". */
export const OFFICE_STREET = "Toà Hoà Bình Green City, 505 Minh Khai, Phường Vĩnh Tuy";

/**
 * "Hà Nội: Toà Hoà Bình Green City, 505 Minh Khai, Phường Vĩnh Tuy, Hà Nội" → phần đường phố.
 * Chỉ ghi "Hà Nội" → địa chỉ văn phòng (mọi vị trí đều làm tại văn phòng). Không phải Hà Nội → undefined.
 */
export function jobStreetAddress(location: string | null | undefined): string | undefined {
  const loc = (location ?? "").trim();
  if (/minh khai/i.test(loc)) {
    return loc
      .replace(/^(hà nội|ha noi|hanoi)\s*[:\-–]\s*/i, "")
      .replace(/,\s*(hà nội|ha noi|hanoi)\.?\s*$/i, "")
      .trim();
  }
  if (/^(hà nội|ha noi|hanoi)\.?$/i.test(loc)) return OFFICE_STREET;
  return undefined;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Mô tả HTML cho JobPosting.description (Google khuyến nghị HTML): tóm tắt + mô tả + các danh sách. */
export function jobDescriptionHtml(job: JobPostingInput): string {
  const parts: string[] = [];
  for (const p of [job.summary, job.description]) {
    const t = p?.trim();
    if (t && !parts.includes(`<p>${escapeHtml(t)}</p>`)) parts.push(`<p>${escapeHtml(t)}</p>`);
  }
  const lists: [string, string[] | null | undefined][] = [
    ["Trách nhiệm", job.responsibilities],
    ["Yêu cầu", job.requirements],
    ["Ưu tiên", job.nice_to_have],
    ["Kỹ năng", job.skills],
  ];
  for (const [heading, items] of lists) {
    const clean = (items ?? []).map((i) => i.trim()).filter(Boolean);
    if (!clean.length) continue;
    parts.push(`<h3>${heading}</h3><ul>${clean.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`);
  }
  return parts.join("");
}

/** JSON-LD JobPosting. Không có validThrough (không có dữ liệu hạn nộp thật); job đóng → trang 404. */
export function jobPostingJsonLd(job: JobPostingInput) {
  const salary = parseSalaryRangeVnd(job.salary);
  const employmentType = employmentTypeOf(job.type);
  const streetAddress = jobStreetAddress(job.location);
  const datePosted = toIsoDate(job.created_at);
  const remote = job.type === "remote";
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: jobDescriptionHtml(job),
    identifier: { "@type": "PropertyValue", name: "TD Games", value: job.slug },
    ...(datePosted ? { datePosted } : {}),
    ...(employmentType ? { employmentType } : {}),
    // @id nối với Organization của root layout; name/sameAs/logo để validator không cần dereference.
    hiringOrganization: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: "TD Games",
      sameAs: SITE_URL,
      logo: ORG_LOGO,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(streetAddress ? { streetAddress } : {}),
        addressLocality: "Hà Nội",
        addressRegion: "Hà Nội",
        addressCountry: "VN",
      },
    },
    ...(remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "VN" },
        }
      : {}),
    directApply: true,
    url: absoluteUrl(`/careers/${job.slug}`),
    ...(job.image_url ? { image: job.image_url.replace(/ /g, "%20") } : {}),
    ...(salary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "VND",
            value: {
              "@type": "QuantitativeValue",
              minValue: salary.min,
              maxValue: salary.max,
              unitText: "MONTH",
            },
          },
        }
      : {}),
  };
}
