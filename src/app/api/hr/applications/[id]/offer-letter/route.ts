import { NextResponse } from "next/server";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { offerTotal, sanitizeOfferLetter, validateOfferLetter } from "@/lib/offer-letter";
import { approvalForClient, EMPTY_APPROVAL, loadOfferLetterForApp, saveOfferLetter, readJsonBody } from "@/lib/offer-letter-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Thư mời nhận việc của hồ sơ: dữ liệu đã lưu đè lên mẫu công ty (chưa lưu → dựng từ mẫu). */
export async function GET(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "emails.send_offer");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const app = await loadScopedApplication(auth.ctx, id, "id, expected_salary").catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const { data, row } = await loadOfferLetterForApp(id);
    return NextResponse.json({
      data,
      saved: !!row,
      updated_by: row?.updated_by ?? null,
      updated_at: row?.updated_at ?? null,
      total: offerTotal(data),
      // Trạng thái Sếp duyệt (thư chưa lưu → draft).
      approval: approvalForClient(row?.approval ?? EMPTY_APPROVAL),
      // Lương mong muốn để tham khảo khi điền (chỉ khi có quyền xem lương).
      expected_salary: auth.ctx.perms.has("apps.view_salary") ? ((app.expected_salary as string | null) ?? null) : null,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được thư mời" }, { status: 500 });
  }
}

/** Lưu thư mời (body = OfferLetterData). Sếp lưu → đã duyệt; người khác sửa nội dung → về draft (xem nextApprovalOnSave). */
export async function PUT(request: Request, { params }: Ctx) {
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
  const invalid = validateOfferLetter(data);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  try {
    const row = await saveOfferLetter(auth.ctx, id, data);
    return NextResponse.json({
      data: row.data,
      saved: true,
      updated_by: row.updated_by,
      updated_at: row.updated_at,
      total: offerTotal(data),
      approval: approvalForClient(row.approval),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không lưu được thư mời" }, { status: 500 });
  }
}
