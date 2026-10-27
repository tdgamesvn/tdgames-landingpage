import { NextResponse } from "next/server";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { loadMentionableMembers } from "@/lib/hr-comment-members";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/hr/applications/:id/mentionable — thành viên có thể @tag trong comment hồ sơ (không trả email). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireHrUser(request, "apps.comment");
  if ("response" in auth) return auth.response;
  const { ctx } = auth;

  const { id } = await params;
  const app = await loadScopedApplication(ctx, id, "job_id, status, offer_status").catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const all = await loadMentionableMembers(app);
    const members = all.filter((m) => m.id !== ctx.user.id);
    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ error: "Không đọc được danh sách thành viên" }, { status: 500 });
  }
}
