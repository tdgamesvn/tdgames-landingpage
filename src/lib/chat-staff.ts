import "server-only";

// Phần dùng chung của API /api/hr/chat/* (tab Chat trong /hr).
import { NextResponse } from "next/server";
import { canSeeAudience, type ChatAudience } from "./chat";
import { threadById, type ChatThreadRow } from "./chat-server";
import { requireHrUser, type HrContext } from "./hr-session";

export const notFound = () => NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

export function visibleAudiences(ctx: HrContext): ChatAudience[] {
  return (["client", "candidate"] as const).filter((a) => canSeeAudience(ctx.perms, a));
}

/** Đăng nhập /hr + có ít nhất 1 quyền chat.clients/chat.candidates. */
export async function requireChatUser(req: Request): Promise<{ ctx: HrContext } | { response: NextResponse }> {
  const auth = await requireHrUser(req);
  if ("response" in auth) return auth;
  if (!visibleAudiences(auth.ctx).length) {
    return { response: NextResponse.json({ error: "Bạn không có quyền làm việc này" }, { status: 403 }) };
  }
  return auth;
}

/** Luồng theo id; không có hoặc không đủ quyền xem loại luồng → null (route trả 404 như nhau). */
export async function loadVisibleThread(ctx: HrContext, id: string): Promise<ChatThreadRow | null> {
  const t = await threadById(id);
  return t && canSeeAudience(ctx.perms, t.audience) ? t : null;
}
