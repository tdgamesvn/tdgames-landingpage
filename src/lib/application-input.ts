/**
 * Lọc dữ liệu form ứng tuyển công khai (POST /api/applications) trước khi ghi DB.
 * Chỉ nhận đúng các trường form /apply gửi — người ngoài không tự đặt được status,
 * ai_score, admin_notes, test_token… Link phải là http(s); CV phải là file đã upload lên CDN.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WORK_TYPES = ["fulltime", "freelancer"];

// Trường text tự do → độ dài tối đa.
const TEXT_FIELDS: Record<string, number> = {
  phone: 40,
  expected_salary: 200,
  rate_per_hour: 200,
  available_hours_per_week: 100,
  source: 200,
  available_from: 100,
  message: 5000,
  referred_by: 100,
};
const LINK_FIELDS = ["portfolio_url", "linkedin_url", "website_url"];

export type ApplicationInsert = Record<string, string | number | null>;

function text(v: unknown, max: number): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

function httpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function sanitizeApplicationInput(
  body: Record<string, unknown>,
  cvHost: string,
): { data: ApplicationInsert } | { error: string } {
  const job_id = text(body.job_id, 64);
  const full_name = text(body.full_name, 200);
  const email = text(body.email, 254);
  const work_type = text(body.work_type, 20);

  if (!job_id || !full_name || !email || !work_type) {
    return { error: "Missing required fields: job_id, full_name, email, work_type" };
  }
  if (!UUID.test(job_id)) return { error: "Invalid job_id" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Invalid email" };
  if (!WORK_TYPES.includes(work_type)) return { error: "Invalid work_type" };

  const data: ApplicationInsert = { job_id, full_name, email, work_type };

  for (const [k, max] of Object.entries(TEXT_FIELDS)) data[k] = text(body[k], max);

  for (const k of LINK_FIELDS) {
    const v = text(body[k], 1000);
    if (v && !httpUrl(v)) return { error: `Invalid ${k}` };
    data[k] = v;
  }

  const cv = text(body.cv_url, 1000);
  if (cv) {
    let ok = false;
    try {
      const u = new URL(cv);
      ok = u.protocol === "https:" && u.hostname === cvHost;
    } catch {
      ok = false;
    }
    if (!ok) return { error: "Invalid cv_url" };
  }
  data.cv_url = cv;

  const years = typeof body.years_experience === "number" ? body.years_experience : Number(body.years_experience);
  data.years_experience =
    body.years_experience != null && Number.isInteger(years) && years >= 0 && years <= 60 ? years : null;

  return { data };
}

/** Telegram parse_mode HTML: escape dữ liệu người dùng để không chèn được thẻ. */
export function escapeTelegramHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
