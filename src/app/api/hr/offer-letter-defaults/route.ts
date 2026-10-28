import { NextResponse } from "next/server";
import { requireHrUser } from "@/lib/hr-session";
import { DEFAULT_OFFER_LETTER_DEFAULTS, sanitizeOfferLetterDefaults, validateOfferLetterDefaults } from "@/lib/offer-letter";
import { loadOfferDefaults, saveOfferDefaults, readJsonBody } from "@/lib/offer-letter-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mẫu công ty cho thư mời nhận việc (app_settings `offer_letter_defaults`; chưa lưu → mặc định trong code). */
export async function GET(request: Request) {
  const auth = await requireHrUser(request);
  if ("response" in auth) return auth.response;
  if (!auth.ctx.perms.has("emails.send_offer") && !auth.ctx.perms.has("emails.templates")) {
    return NextResponse.json({ error: "Bạn không có quyền làm việc này" }, { status: 403 });
  }
  try {
    const { defaults, saved } = await loadOfferDefaults();
    return NextResponse.json({ defaults, saved, builtin: DEFAULT_OFFER_LETTER_DEFAULTS });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được mẫu" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireHrUser(request, "emails.templates");
  if ("response" in auth) return auth.response;
  const body = await readJsonBody(request);
  if ("response" in body) return body.response;
  const input = body.data;
  const defaults = sanitizeOfferLetterDefaults(input);
  const invalid = validateOfferLetterDefaults(defaults);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  try {
    await saveOfferDefaults(defaults);
    return NextResponse.json({ defaults, saved: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không lưu được mẫu" }, { status: 500 });
  }
}
