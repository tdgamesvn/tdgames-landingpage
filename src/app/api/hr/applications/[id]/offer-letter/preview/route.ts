import { NextResponse } from "next/server";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { offerFileName, sanitizeOfferLetter, validateOfferLetterLimits } from "@/lib/offer-letter";
import { PdfBusyError, renderOfferLetterPdf } from "@/lib/offer-letter-pdf";
import { pdfDisposition, pdfUserKey, readJsonBody } from "@/lib/offer-letter-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Xem trước PDF từ dữ liệu form CHƯA lưu. Không ghi gì. Chỉ kiểm giới hạn (độ dài, số mục, số tiền)
 * — chưa đủ trường bắt buộc vẫn xem trước được; gửi mail mới bắt đủ.
 */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "emails.send_offer");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const app = await loadScopedApplication(auth.ctx, id).catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await readJsonBody(request);
  if ("response" in body) return body.response;
  const input = body.data;
  const data = sanitizeOfferLetter(input);
  const invalid = validateOfferLetterLimits(data);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  try {
    const pdf = await renderOfferLetterPdf(data, pdfUserKey(auth.ctx));
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": pdfDisposition("inline", offerFileName(data.candidateName)),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof PdfBusyError) return NextResponse.json({ error: e.message }, { status: 429 });
    console.error("[offer-letter] render preview lỗi:", e);
    return NextResponse.json({ error: "Không tạo được PDF" }, { status: 500 });
  }
}
