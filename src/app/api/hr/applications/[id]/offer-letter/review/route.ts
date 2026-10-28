import { after, NextResponse } from "next/server";
import { requireBoss, loadScopedApplication } from "@/lib/hr-session";
import { canReview, OFFER_CHANGED_SINCE_REVIEW, sameVersion, validateReviewInput } from "@/lib/offer-letter-approval";
import { loadOfferLetterRow, readJsonBody, transitionOfferApproval } from "@/lib/offer-letter-store";
import { notifyOfferApproval } from "@/lib/hr-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Sếp duyệt / yêu cầu sửa thư mời đang chờ: `{ decision: "approve" | "changes", note? }`.
 * Chỉ vai Sếp. Yêu cầu sửa bắt buộc có ghi chú (≤ 500 ký tự). Thông báo người gửi duyệt + người support.
 */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireBoss(request);
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await params;
  const app = await loadScopedApplication(ctx, id).catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await readJsonBody(request);
  if ("response" in body) return body.response;
  const input = validateReviewInput(body.data);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });

  // Duyệt gắn với phiên bản thư Sếp đã xem (updated_at lấy từ GET offer-letter).
  const expected = (body.data as Record<string, unknown> | null)?.updated_at;
  if (typeof expected !== "string" || !expected) {
    return NextResponse.json({ error: "Thiếu updated_at của bản thư đã xem" }, { status: 400 });
  }

  let letter;
  try {
    letter = await loadOfferLetterRow(id);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được thư mời" }, { status: 500 });
  }
  if (!letter) return NextResponse.json({ error: "Chưa có thư mời" }, { status: 400 });
  if (!canReview(ctx.role, letter.approval.status)) {
    return NextResponse.json({ error: "Thư không ở trạng thái chờ duyệt" }, { status: 400 });
  }

  if (!sameVersion(expected, letter.updated_at)) {
    return NextResponse.json({ error: OFFER_CHANGED_SINCE_REVIEW, code: "offer_changed" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const status = input.decision === "approve" ? "approved" : "changes_requested";
  const reviewNote = input.note || null;
  try {
    const ok = await transitionOfferApproval(id, ["pending"], {
      approval_status: status,
      reviewed_by: ctx.user.displayName,
      reviewed_by_user_id: ctx.user.id,
      reviewed_at: now,
      review_note: reviewNote,
    }, expected);
    if (!ok) return NextResponse.json({ error: OFFER_CHANGED_SINCE_REVIEW, code: "offer_changed" }, { status: 409 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không lưu được quyết định" }, { status: 500 });
  }

  after(() =>
    notifyOfferApproval({
      kind: "reviewed",
      appId: id,
      actorId: ctx.user.id,
      actorName: ctx.user.displayName,
      submitterId: letter.approval.submitted_by_user_id,
      decision: input.decision,
      note: input.note,
    }).catch((e) => console.error("[offer-letter] notify reviewed lỗi:", e)),
  );
  return NextResponse.json({
    approval: {
      status,
      submitted_by: letter.approval.submitted_by,
      submitted_at: letter.approval.submitted_at,
      reviewed_by: ctx.user.displayName,
      reviewed_at: now,
      review_note: reviewNote,
    },
  });
}
