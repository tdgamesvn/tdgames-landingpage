import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { sanitizeOfferLetter } from "@/lib/offer-letter";
import { renderOfferLetterPdf } from "@/lib/offer-letter-pdf";
import { pdfDisposition } from "@/lib/offer-letter-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ emailId: string }> };

/** Tải lại file đính kèm của mail đã gửi (`?i=0`): sinh lại PDF thư mời từ snapshot lúc gửi. */
export async function GET(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "emails.send_offer");
  if ("response" in auth) return auth.response;
  const { emailId } = await params;
  const i = Number(new URL(request.url).searchParams.get("i") ?? "0");
  if (!Number.isInteger(i) || i < 0 || i > 20) return NextResponse.json({ error: "i không hợp lệ" }, { status: 400 });

  const { data: mail, error } = await getSupabaseAdmin()
    .from("candidate_emails")
    .select("id, application_id, attachments")
    .eq("id", emailId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Không đọc được mail" }, { status: 500 });
  if (!mail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Phạm vi theo hồ sơ của mail: ngoài phạm vi → 404 như không tồn tại.
  const app = await loadScopedApplication(auth.ctx, String(mail.application_id)).catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const list = Array.isArray(mail.attachments) ? (mail.attachments as unknown[]) : [];
  const att = list[i] as { filename?: unknown; kind?: unknown; snapshot?: unknown } | undefined;
  if (!att || att.kind !== "offer_letter" || !att.snapshot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const filename = typeof att.filename === "string" && att.filename ? att.filename : "Thư mời nhận việc.pdf";
  try {
    const pdf = await renderOfferLetterPdf(sanitizeOfferLetter(att.snapshot));
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": pdfDisposition("inline", filename),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[offer-letter] render attachment lỗi:", e);
    return NextResponse.json({ error: "Không tạo được PDF" }, { status: 500 });
  }
}
