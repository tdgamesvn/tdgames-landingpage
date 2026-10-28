import { NextResponse } from "next/server";
import { requireHrUser } from "@/lib/hr-session";
import { offerFileName, sanitizeOfferLetter, validateOfferLetterLimits } from "@/lib/offer-letter";
import { PdfBusyError, renderOfferLetterPdf } from "@/lib/offer-letter-pdf";
import { pdfDisposition, pdfUserKey, readJsonBody } from "@/lib/offer-letter-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Xem trước PDF cho tab "Mẫu mail → Thư mời nhận việc": body là OfferLetterData dựng từ mẫu công ty
 * đang sửa + dữ liệu mẫu (không gắn hồ sơ nào). Không ghi gì.
 */
export async function POST(request: Request) {
  const auth = await requireHrUser(request, "emails.templates");
  if ("response" in auth) return auth.response;
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
    console.error("[offer-letter] render preview mẫu lỗi:", e);
    return NextResponse.json({ error: "Không tạo được PDF" }, { status: 500 });
  }
}
