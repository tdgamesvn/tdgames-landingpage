import "server-only";

/**
 * Đọc/ghi thư mời nhận việc trong DB: mẫu công ty (app_settings `offer_letter_defaults`),
 * thư từng hồ sơ (offer_letters), người liên hệ cho mail offer (hr_users).
 * Hàm throw khi lỗi DB — route bắt và trả 500.
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "./supabase-admin";
import type { HrContext } from "./hr-session";
import { offerContact, type OfferContactUser } from "./hr-email-templates";
import {
  buildOfferLetterData,
  mergeOfferLetter,
  sanitizeOfferLetter,
  sanitizeOfferLetterDefaults,
  type OfferLetterData,
  type OfferLetterDefaults,
} from "./offer-letter";

export const OFFER_DEFAULTS_KEY = "offer_letter_defaults";

export type OfferLetterRow = {
  data: OfferLetterData;
  updated_by: string | null;
  updated_at: string | null;
};

/** Mẫu công ty; chưa lưu / JSON hỏng → mặc định trong code. */
export async function loadOfferDefaults(): Promise<{ defaults: OfferLetterDefaults; saved: boolean }> {
  const { data, error } = await getSupabaseAdmin()
    .from("app_settings")
    .select("value")
    .eq("key", OFFER_DEFAULTS_KEY)
    .maybeSingle();
  if (error) throw new Error(`loadOfferDefaults: ${error.message}`);
  if (!data?.value) return { defaults: sanitizeOfferLetterDefaults(null), saved: false };
  try {
    return { defaults: sanitizeOfferLetterDefaults(JSON.parse(String(data.value))), saved: true };
  } catch {
    console.error("[offer-letter] app_settings offer_letter_defaults không phải JSON, dùng mặc định");
    return { defaults: sanitizeOfferLetterDefaults(null), saved: false };
  }
}

export async function saveOfferDefaults(defaults: OfferLetterDefaults): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("app_settings")
    .upsert({ key: OFFER_DEFAULTS_KEY, value: JSON.stringify(defaults), updated_at: new Date().toISOString() });
  if (error) throw new Error(`saveOfferDefaults: ${error.message}`);
}

/** Thư đã lưu của hồ sơ (dữ liệu đã sanitize) hoặc null. */
export async function loadOfferLetterRow(applicationId: string): Promise<OfferLetterRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("offer_letters")
    .select("data, updated_by, updated_at")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (error) throw new Error(`loadOfferLetterRow: ${error.message}`);
  if (!data) return null;
  return {
    data: sanitizeOfferLetter(data.data),
    updated_by: (data.updated_by as string | null) ?? null,
    updated_at: (data.updated_at as string | null) ?? null,
  };
}

export async function saveOfferLetter(ctx: HrContext, applicationId: string, data: OfferLetterData): Promise<OfferLetterRow> {
  const row = {
    application_id: applicationId,
    data,
    updated_by: ctx.user.displayName,
    updated_by_user_id: ctx.user.id,
    updated_at: new Date().toISOString(),
  };
  const { error } = await getSupabaseAdmin().from("offer_letters").upsert(row);
  if (error) throw new Error(`saveOfferLetter: ${error.message}`);
  return { data, updated_by: row.updated_by, updated_at: row.updated_at };
}

/** Thư cho form: mẫu công ty + tên/chức danh từ hồ sơ, đè bởi dữ liệu đã lưu (nếu có). */
export async function loadOfferLetterForApp(applicationId: string): Promise<{ data: OfferLetterData; row: OfferLetterRow | null }> {
  const { data: app, error } = await getSupabaseAdmin()
    .from("applications")
    .select("full_name, jobs(title)")
    .eq("id", applicationId)
    .maybeSingle();
  if (error) throw new Error(`loadOfferLetterForApp: ${error.message}`);
  const job = (Array.isArray(app?.jobs) ? app?.jobs[0] : app?.jobs) as { title?: string } | null | undefined;
  const [{ defaults }, row] = await Promise.all([loadOfferDefaults(), loadOfferLetterRow(applicationId)]);
  const built = buildOfferLetterData(defaults, {
    candidateName: String(app?.full_name ?? ""),
    jobTitle: String(job?.title ?? ""),
    today: new Date(),
  });
  return { data: mergeOfferLetter(row?.data ?? null, built), row };
}

/** Dòng "Người liên hệ" cho mail offer theo người gửi (xem offerContact). */
export async function loadOfferContact(ctx: HrContext): Promise<string> {
  const { data, error } = await getSupabaseAdmin()
    .from("hr_users")
    .select("id, role, display_name, email, phone, disabled, created_at");
  if (error) throw new Error(`loadOfferContact: ${error.message}`);
  const users = (data ?? []) as (OfferContactUser & { id: string })[];
  const sender = (ctx.user.id ? users.find((u) => u.id === ctx.user.id) : null) ?? null;
  return offerContact(sender, users);
}

/** Header Content-Disposition cho PDF (tên file có dấu → filename* UTF-8, kèm bản ASCII dự phòng). */
export function pdfDisposition(type: "inline" | "attachment", filename: string): string {
  const ascii = filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^\x20-\x7e]|["\\]/g, "_");
  // RFC 5987 attr-char không có ' ( ) * — encodeURIComponent để nguyên nên mã hoá thêm.
  const ext = encodeURIComponent(filename).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${type}; filename="${ascii}"; filename*=UTF-8''${ext}`;
}

export const MAX_BODY_BYTES = 200_000;

/** Đọc body JSON có giới hạn: Content-Length > 200KB → 413 trước khi đọc; đọc xong vẫn quá → 413; JSON hỏng → 400. */
export async function readJsonBody(request: Request): Promise<{ data: unknown } | { response: NextResponse }> {
  const tooLarge = () => ({ response: NextResponse.json({ error: "Dữ liệu quá lớn" }, { status: 413 }) });
  const len = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(len) && len > MAX_BODY_BYTES) return tooLarge();
  const raw = await request.text().catch(() => "");
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return tooLarge();
  try {
    return { data: JSON.parse(raw) };
  } catch {
    return { response: NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 }) };
  }
}

/** Khoá render theo tài khoản (xem renderOfferLetterPdf). */
export function pdfUserKey(ctx: HrContext): string {
  return ctx.user.id ?? ctx.user.email;
}
