import { after, NextResponse } from "next/server";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { validateOfferLetter } from "@/lib/offer-letter";
import { canSubmit } from "@/lib/offer-letter-approval";
import { loadOfferLetterRow, transitionOfferApproval } from "@/lib/offer-letter-store";
import { notifyOfferApproval } from "@/lib/hr-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Gửi thư mời đã lưu cho Sếp duyệt: draft | changes_requested → pending. Thông báo mọi Sếp (Discord tag + push).
 * Sếp không cần gửi duyệt (Sếp lưu = đã duyệt) → 400.
 */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "emails.send_offer");
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await params;
  const app = await loadScopedApplication(ctx, id).catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role === "boss") {
    return NextResponse.json({ error: "Sếp lưu thư là đã duyệt, không cần gửi duyệt" }, { status: 400 });
  }

  let letter;
  try {
    letter = await loadOfferLetterRow(id);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được thư mời" }, { status: 500 });
  }
  if (!letter) return NextResponse.json({ error: "Chưa có thư mời — soạn và lưu thư trước" }, { status: 400 });
  const invalid = validateOfferLetter(letter.data);
  if (invalid) return NextResponse.json({ error: `Thư mời nhận việc chưa đủ: ${invalid}` }, { status: 400 });
  if (!canSubmit(letter.approval.status)) {
    return NextResponse.json(
      { error: letter.approval.status === "pending" ? "Thư đã gửi Sếp duyệt, đang chờ" : "Thư đã được Sếp duyệt" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  try {
    const ok = await transitionOfferApproval(id, ["draft", "changes_requested"], {
      approval_status: "pending",
      submitted_by: ctx.user.displayName,
      submitted_by_user_id: ctx.user.id,
      submitted_at: now,
      // Vòng duyệt mới: xoá phản hồi vòng trước.
      reviewed_by: null,
      reviewed_by_user_id: null,
      reviewed_at: null,
      review_note: null,
    });
    if (!ok) return NextResponse.json({ error: "Trạng thái thư vừa thay đổi, tải lại rồi thử lại" }, { status: 409 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không gửi duyệt được" }, { status: 500 });
  }

  after(() =>
    notifyOfferApproval({ kind: "submitted", appId: id, actorId: ctx.user.id, actorName: ctx.user.displayName }).catch((e) =>
      console.error("[offer-letter] notify submitted lỗi:", e),
    ),
  );
  return NextResponse.json({
    approval: {
      status: "pending",
      submitted_by: ctx.user.displayName,
      submitted_at: now,
      reviewed_by: null,
      reviewed_at: null,
      review_note: null,
    },
  });
}
