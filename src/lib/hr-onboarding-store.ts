import "server-only";

/**
 * Đọc/ghi Onboard người mới: mẫu checklist (app_settings `hr_onboarding_checklist`, value là chuỗi JSON)
 * và checklist từng hồ sơ (bảng hr_onboarding). Logic thuần nằm ở hr-onboarding.ts.
 * Bảng không có trigger updated_at → store tự ghi updated_at mỗi lần update (dùng làm khoá lạc quan).
 * Hàm throw khi lỗi DB — route/cron bắt và xử lý.
 */

import { getSupabaseAdmin } from "./supabase-admin";
import { isValidDate } from "./offer-letter.ts";
import {
  DEFAULT_ONBOARDING_TEMPLATE,
  ONBOARD_STAGES,
  itemsFromTemplate,
  onboardingProgress,
  sanitizeOnboardingTemplate,
  validateOnboardingTemplate,
  type OnboardItem,
  type OnboardReminded,
  type OnboardStage,
  type OnboardTemplateItem,
} from "./hr-onboarding.ts";

export const ONBOARDING_TEMPLATE_KEY = "hr_onboarding_checklist";

export type OnboardingRow = { items: OnboardItem[]; reminded: OnboardReminded; updated_at: string };

const ROW_COLUMNS = "items, reminded, updated_at";
/** Số id mỗi lần `.in()` — tránh URL PostgREST quá dài. */
const IN_CHUNK = 200;

let warnedBadTemplate = false;

function defaultTemplate(): OnboardTemplateItem[] {
  return DEFAULT_ONBOARDING_TEMPLATE.map((x) => ({ ...x }));
}

// ───────────────────────── Mẫu checklist ─────────────────────────

/** Mẫu đang dùng; chưa lưu / sai JSON / rỗng hoặc không hợp lệ sau sanitize → mặc định (saved: false). */
export async function loadOnboardingTemplate(): Promise<{ items: OnboardTemplateItem[]; saved: boolean }> {
  const { data, error } = await getSupabaseAdmin()
    .from("app_settings")
    .select("value")
    .eq("key", ONBOARDING_TEMPLATE_KEY)
    .maybeSingle();
  if (error) throw new Error(`loadOnboardingTemplate: ${error.message}`);
  if (!data?.value) return { items: defaultTemplate(), saved: false };
  let items: OnboardTemplateItem[] = [];
  try {
    items = sanitizeOnboardingTemplate(JSON.parse(String(data.value)));
  } catch {
    items = [];
  }
  if (items.length === 0 || validateOnboardingTemplate(items) !== null) {
    if (!warnedBadTemplate) {
      warnedBadTemplate = true;
      console.error(`[hr-onboarding] app_settings ${ONBOARDING_TEMPLATE_KEY} không hợp lệ, dùng mặc định`);
    }
    return { items: defaultTemplate(), saved: false };
  }
  return { items, saved: true };
}

/** Lưu mẫu (sanitize rồi validate lại; không hợp lệ → throw, không ghi). */
export async function saveOnboardingTemplate(items: OnboardTemplateItem[]): Promise<void> {
  const clean = sanitizeOnboardingTemplate(items);
  const err = validateOnboardingTemplate(clean);
  if (err) throw new Error(`saveOnboardingTemplate: ${err}`);
  const { error } = await getSupabaseAdmin()
    .from("app_settings")
    .upsert({ key: ONBOARDING_TEMPLATE_KEY, value: JSON.stringify(clean), updated_at: new Date().toISOString() });
  if (error) throw new Error(`saveOnboardingTemplate: ${error.message}`);
  warnedBadTemplate = false;
}

/** Về mẫu mặc định (xoá key). */
export async function resetOnboardingTemplate(): Promise<void> {
  const { error } = await getSupabaseAdmin().from("app_settings").delete().eq("key", ONBOARDING_TEMPLATE_KEY);
  if (error) throw new Error(`resetOnboardingTemplate: ${error.message}`);
}

// ───────────────────────── Checklist từng hồ sơ ─────────────────────────

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

/** jsonb items từ DB → OnboardItem[] (bỏ phần tử hỏng). */
function toItems(v: unknown): OnboardItem[] {
  if (!Array.isArray(v)) return [];
  const out: OnboardItem[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.label !== "string") continue;
    if (!ONBOARD_STAGES.includes(r.stage as OnboardStage)) continue;
    out.push({
      id: r.id,
      label: r.label,
      stage: r.stage as OnboardStage,
      leader: r.leader === true,
      done_at: str(r.done_at),
      done_by_user_id: str(r.done_by_user_id),
      done_by_name: str(r.done_by_name),
    });
  }
  return out;
}

/** jsonb reminded từ DB → OnboardReminded (chỉ giữ mốc hợp lệ). */
function toReminded(v: unknown): OnboardReminded {
  const out: OnboardReminded = {};
  if (!v || typeof v !== "object" || Array.isArray(v)) return out;
  const r = v as Record<string, unknown>;
  for (const s of ONBOARD_STAGES) {
    const e = r[s];
    if (!e || typeof e !== "object") continue;
    const at = str((e as Record<string, unknown>).at);
    const forDate = str((e as Record<string, unknown>).for_date);
    if (at && forDate) out[s] = { at, for_date: forDate };
  }
  return out;
}

function toRow(d: { items?: unknown; reminded?: unknown; updated_at?: unknown }): OnboardingRow {
  return { items: toItems(d.items), reminded: toReminded(d.reminded), updated_at: String(d.updated_at ?? "") };
}

async function loadOnboardingRow(appId: string): Promise<OnboardingRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("hr_onboarding")
    .select(ROW_COLUMNS)
    .eq("application_id", appId)
    .maybeSingle();
  if (error) throw new Error(`loadOnboardingRow: ${error.message}`);
  return data ? toRow(data) : null;
}

/** Dòng onboard của hồ sơ; chưa có → tạo từ mẫu hiện tại (on conflict do nothing) rồi đọc lại. */
export async function ensureOnboarding(appId: string): Promise<OnboardingRow> {
  const existing = await loadOnboardingRow(appId);
  if (existing) return existing;
  const { items } = await loadOnboardingTemplate();
  const { error } = await getSupabaseAdmin()
    .from("hr_onboarding")
    .upsert(
      { application_id: appId, items: itemsFromTemplate(items), reminded: {}, updated_at: new Date().toISOString() },
      { onConflict: "application_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(`ensureOnboarding: ${error.message}`);
  const row = await loadOnboardingRow(appId);
  if (!row) throw new Error("ensureOnboarding: không đọc lại được dòng vừa tạo");
  return row;
}

/**
 * Sửa items theo khoá lạc quan updated_at (tự ensureOnboarding trước).
 * mutate nhận bản sao items, trả null = không tìm thấy mục → "not_found".
 * Bị ghi đè giữa chừng → đọc lại và áp mutate thêm 1 lần; vẫn trượt → "conflict".
 * mutate có thể chạy 2 lần nên phải là hàm thuần theo items đầu vào.
 */
export async function updateOnboardingItems(
  appId: string,
  mutate: (items: OnboardItem[]) => OnboardItem[] | null,
): Promise<OnboardingRow | "not_found" | "conflict"> {
  const db = getSupabaseAdmin();
  let row: OnboardingRow | null = await ensureOnboarding(appId);
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!row) return "not_found"; // hồ sơ bị xoá giữa chừng (cascade)
    const next = mutate(row.items.map((x) => ({ ...x })));
    if (next === null) return "not_found";
    const now = new Date().toISOString();
    const { data, error } = await db
      .from("hr_onboarding")
      .update({ items: next, updated_at: now })
      .eq("application_id", appId)
      .eq("updated_at", row.updated_at)
      .select(ROW_COLUMNS);
    if (error) throw new Error(`updateOnboardingItems: ${error.message}`);
    if (data && data.length > 0) return toRow(data[0]);
    row = await loadOnboardingRow(appId);
  }
  return "conflict";
}

/** Ghi dấu đã nhắc mốc `stage` cho ngày đi làm `forDate` (đọc–ghi; cron chạy tuần tự nên không khoá). */
export async function markReminded(appId: string, stage: OnboardStage, forDate: string): Promise<void> {
  const row = await ensureOnboarding(appId);
  const now = new Date().toISOString();
  const reminded: OnboardReminded = { ...row.reminded, [stage]: { at: now, for_date: forDate } };
  const { error } = await getSupabaseAdmin()
    .from("hr_onboarding")
    .update({ reminded, updated_at: now })
    .eq("application_id", appId);
  if (error) throw new Error(`markReminded: ${error.message}`);
}

export type OnboardingSummary = { start_date: string | null; confirmed: boolean; done: number; total: number };

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Tóm tắt onboard cho nhiều hồ sơ (thẻ pipeline): ngày đi làm + tiến độ.
 * Ngày: placement hợp lệ trước, rồi ngày bắt đầu trên thư mời (giống effectiveStartDate).
 * BẢO MẬT: offer_letters.data có lương → chỉ select đúng đường JSON startDate, không bao giờ select `data`.
 * Hồ sơ chưa có dòng onboard → done 0 / total = độ dài mẫu hiện tại.
 */
export async function loadOnboardingSummaries(appIds: string[]): Promise<Map<string, OnboardingSummary>> {
  const out = new Map<string, OnboardingSummary>();
  const ids = [...new Set(appIds)];
  if (ids.length === 0) return out;
  const db = getSupabaseAdmin();

  const placements = new Map<string, { start_date: string | null; start_confirmed: boolean }>();
  const offerStarts = new Map<string, string | null>();
  const progress = new Map<string, { done: number; total: number }>();

  await Promise.all(
    chunks(ids, IN_CHUNK).map(async (part) => {
      const [plRes, offRes, obRes] = await Promise.all([
        db.from("referral_placements").select("application_id, start_date, start_confirmed").in("application_id", part),
        db.from("offer_letters").select("application_id, start:data->>startDate").in("application_id", part),
        db.from("hr_onboarding").select("application_id, items").in("application_id", part),
      ]);
      if (plRes.error) throw new Error(`loadOnboardingSummaries.placements: ${plRes.error.message}`);
      if (offRes.error) throw new Error(`loadOnboardingSummaries.offers: ${offRes.error.message}`);
      if (obRes.error) throw new Error(`loadOnboardingSummaries.onboarding: ${obRes.error.message}`);
      for (const r of plRes.data ?? []) {
        placements.set(String(r.application_id), { start_date: str(r.start_date), start_confirmed: r.start_confirmed === true });
      }
      for (const r of (offRes.data ?? []) as { application_id: unknown; start: unknown }[]) {
        offerStarts.set(String(r.application_id), str(r.start));
      }
      for (const r of obRes.data ?? []) {
        progress.set(String(r.application_id), onboardingProgress(toItems(r.items)));
      }
    }),
  );

  const templateTotal = ids.some((id) => !progress.has(id)) ? (await loadOnboardingTemplate()).items.length : 0;

  for (const id of ids) {
    const pl = placements.get(id);
    const offer = offerStarts.get(id) ?? null;
    let start_date: string | null = null;
    let confirmed = false;
    if (pl?.start_date && isValidDate(pl.start_date)) {
      start_date = pl.start_date;
      confirmed = pl.start_confirmed;
    } else if (offer && isValidDate(offer)) {
      start_date = offer;
    }
    const p = progress.get(id) ?? { done: 0, total: templateTotal };
    out.set(id, { start_date, confirmed, done: p.done, total: p.total });
  }
  return out;
}
