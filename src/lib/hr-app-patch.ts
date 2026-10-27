// Luật PATCH hồ sơ khi người gọi KHÔNG có apps.edit. Thuần (không import server) để test.
import type { HrRole, PermissionKey } from "./hr-permissions.ts";

export const OFFER_STATUSES = ["pending", "accepted", "declined"] as const;

/** null = được phép; chuỗi = lỗi tiếng Việt (route trả 403). */
export function checkAppPatch(
  ctx: { role: HrRole; perms: Set<PermissionKey> },
  oldStatus: string,
  body: Record<string, unknown>,
): string | null {
  if (ctx.perms.has("apps.edit")) return null;
  for (const key of Object.keys(body)) {
    if (key === "test_review") {
      if (!ctx.perms.has("apps.review_test")) return "Bạn không có quyền chấm bài test";
    } else if (key === "offer_status") {
      if (!ctx.perms.has("apps.offer")) return "Bạn không có quyền ghi kết quả offer";
    } else if (key === "status") {
      if (!(ctx.perms.has("apps.offer") && oldStatus === "interview" && body.status === "offer")) {
        return "Bạn chỉ được chuyển hồ sơ từ Interview sang Offer";
      }
    } else {
      return "Bạn không có quyền sửa trường này";
    }
  }
  return null;
}
