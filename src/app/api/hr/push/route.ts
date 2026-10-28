import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { getVapid, sendHrPush } from "@/lib/hr-push";
import { isPushSubscriptionInput } from "@/lib/hr-push-payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Endpoint phải tồn tại; chỉ thao tác endpoint của mình hoặc chưa gắn user (máy bật chuông từ thời mật khẩu chung). */
async function endpointUsable(userId: string | null, endpoint: string): Promise<boolean> {
  const { data } = await getSupabaseAdmin().from("hr_push_subscriptions").select("user_id").eq("endpoint", endpoint).maybeSingle();
  if (!data) return false; // không có thiết bị nào với endpoint này
  if (!userId) return false;
  return data.user_id === null || data.user_id === userId;
}

/** Khoá công khai VAPID để trình duyệt đăng ký nhận thông báo. */
export async function GET(request: Request) {
  const auth = await requireHrUser(request, "push.receive");
  if ("response" in auth) return auth.response;
  const vapid = getVapid();
  return NextResponse.json({ publicKey: vapid?.publicKey ?? null });
}

/**
 * `{ subscription, label? }` → lưu thiết bị (trùng endpoint thì cập nhật).
 * `{ action: "test", endpoint }` → gửi thử 1 thông báo tới đúng thiết bị đó.
 */
export async function POST(request: Request) {
  const auth = await requireHrUser(request, "push.receive");
  if ("response" in auth) return auth.response;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });

  if (body.action === "test") {
    if (typeof body.endpoint !== "string" || !body.endpoint) return NextResponse.json({ error: "Thiếu endpoint" }, { status: 400 });
    if (!(await endpointUsable(auth.ctx.user.id, body.endpoint))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const r = await sendHrPush(
      { title: "🔔 Thông báo HR đã bật", body: "Máy này sẽ nhận nhắc lịch PV trước giờ hẹn ~60 phút.", url: "/hr", tag: "hr-test" },
      { onlyEndpoint: body.endpoint },
    );
    if (r.disabled) return NextResponse.json({ error: "Server chưa cấu hình khoá VAPID" }, { status: 500 });
    if (r.sent === 0) return NextResponse.json({ error: "Không gửi được — thử tắt rồi bật lại thông báo" }, { status: 502 });
    return NextResponse.json(r);
  }

  if (!isPushSubscriptionInput(body.subscription)) {
    return NextResponse.json({ error: "Subscription không hợp lệ" }, { status: 400 });
  }
  const s = body.subscription;
  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim().slice(0, 80) : null;
  const { error } = await getSupabaseAdmin()
    .from("hr_push_subscriptions")
    .upsert(
      {
        endpoint: s.endpoint,
        p256dh: s.keys.p256dh,
        auth: s.keys.auth,
        label,
        user_id: auth.ctx.user.id,
        user_agent: (request.headers.get("user-agent") ?? "").slice(0, 300) || null,
      },
      { onConflict: "endpoint" },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** `{ endpoint }` → máy này thôi nhận thông báo. */
export async function DELETE(request: Request) {
  const auth = await requireHrUser(request, "push.receive");
  if ("response" in auth) return auth.response;
  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (typeof body?.endpoint !== "string") return NextResponse.json({ error: "Thiếu endpoint" }, { status: 400 });
  let del = getSupabaseAdmin().from("hr_push_subscriptions").delete().eq("endpoint", body.endpoint);
  // Có tài khoản → chỉ xoá thiết bị của mình hoặc thiết bị chưa gắn tài khoản.
  if (auth.ctx.user.id) del = del.or(`user_id.eq.${auth.ctx.user.id},user_id.is.null`);
  const { error } = await del;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
