import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSecret } from "@/lib/admin-auth";

/**
 * Bật Draft Mode rồi ném thẳng sang trang blog thật, để sếp xem bài chưa publish
 * đúng bằng giao diện production — không phải bản mô phỏng trong admin.
 *
 * ponytail: dùng `draftMode()` của Next thay vì tự dựng renderer markdown thứ hai
 * trong admin. Preview mà lệch giao diện thật thì vô nghĩa.
 *
 * Secret đi qua query string vì mở tab mới không gửi được header — đây là pattern
 * Draft Mode chuẩn của Next. Đổi lại secret chỉ lộ ở đúng request này, sau đó
 * phiên preview chạy bằng cookie.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");

  if (!slug) return new Response("slug is required", { status: 400 });

  const adminSecret = await getAdminSecret();
  if (!adminSecret) return new Response("ADMIN_SECRET not configured", { status: 500 });
  if (secret !== adminSecret) return new Response("Unauthorized", { status: 401 });

  (await draftMode()).enable();
  redirect(`/blog/${slug}`);
}
