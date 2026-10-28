import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { AUTO_ACK_KEY } from "@/lib/hr-auto-ack";
import { readAutoAckEnabled } from "@/lib/hr-auto-ack-send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Công tắc tự gửi mail "Cảm ơn ứng tuyển": `{ enabled: boolean }`. Không có dòng cài đặt = bật. */
export async function GET(req: Request) {
  const auth = await requireHrUser(req, "emails.templates");
  if ("response" in auth) return auth.response;
  try {
    return NextResponse.json({ enabled: await readAutoAckEnabled() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được cài đặt" }, { status: 500 });
  }
}

/** PUT { enabled: boolean } — Tắt = ghi "off"; Bật = xoá dòng (mặc định bật). */
export async function PUT(req: Request) {
  const auth = await requireHrUser(req, "emails.templates");
  if ("response" in auth) return auth.response;
  const body = await req.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") return NextResponse.json({ error: "enabled phải là true/false" }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const { error } = body.enabled
    ? await supabase.from("app_settings").delete().eq("key", AUTO_ACK_KEY)
    : await supabase.from("app_settings").upsert({ key: AUTO_ACK_KEY, value: "off", updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, enabled: body.enabled });
}
