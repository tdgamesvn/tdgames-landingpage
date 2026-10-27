import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { getVapid, sendHrPush } from "@/lib/hr-push";
import { isPushSubscriptionInput } from "@/lib/hr-push-payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    if (typeof body.endpoint !== "string") return NextResponse.json({ error: "Thiếu endpoint" }, { status: 400 });
    const r = await sendHrPush(
      { title: "🔔 Thông báo HR đã bật", body: "Máy này sẽ nhận nhắc lịch PV trước giờ hẹn ~60 phút.", url: "/hr", tag: "hr-test" },
      body.endpoint,
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
        user_id: auth.ctx.user.id, // tài khoản cũ (mật khẩu chung) → null
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
  const { error } = await getSupabaseAdmin().from("hr_push_subscriptions").delete().eq("endpoint", body.endpoint);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
