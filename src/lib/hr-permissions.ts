// Vai & quyền của tài khoản /hr. Thuần (không import server) để dùng cả client lẫn test.

export const HR_ROLES = ["boss", "hr", "leader", "accountant"] as const;
export type HrRole = (typeof HR_ROLES)[number];

export const ROLE_LABEL: Record<HrRole, string> = {
  boss: "Sếp",
  hr: "HR",
  leader: "Leader",
  accountant: "Kế toán",
};

export type PermissionDef = {
  key: string;
  label: string;
  group: string;
  defaults: Record<Exclude<HrRole, "boss">, boolean>;
};

const d = (hr: boolean, leader: boolean, accountant: boolean) => ({ hr, leader, accountant });

export const HR_PERMISSIONS = [
  { key: "apps.view_contact", label: "Xem liên hệ (email, SĐT, LinkedIn, website)", group: "Hồ sơ ứng viên", defaults: d(true, false, true) },
  { key: "apps.view_salary", label: "Xem lương mong muốn / rate", group: "Hồ sơ ứng viên", defaults: d(true, false, true) },
  { key: "apps.view_ai", label: "Xem điểm & đánh giá AI, MBTI, xếp hạng", group: "Hồ sơ ứng viên", defaults: d(true, false, false) },
  { key: "apps.view_notes", label: "Xem ghi chú nội bộ & lý do loại", group: "Hồ sơ ứng viên", defaults: d(true, false, false) },
  { key: "apps.view_interviews", label: "Xem lịch PV", group: "Hồ sơ ứng viên", defaults: d(true, true, true) },
  { key: "apps.view_interview_analysis", label: "Xem gỡ băng & phân tích ghi âm PV", group: "Hồ sơ ứng viên", defaults: d(true, false, false) },
  { key: "apps.view_tests", label: "Xem bài test & bài nộp", group: "Hồ sơ ứng viên", defaults: d(true, true, false) },
  { key: "apps.view_emails", label: "Xem lịch sử mail ứng viên", group: "Hồ sơ ứng viên", defaults: d(true, false, true) },
  { key: "apps.comment", label: "Xem / viết comment", group: "Hồ sơ ứng viên", defaults: d(true, true, true) },
  { key: "apps.review_test", label: "Chấm bài test", group: "Thao tác hồ sơ", defaults: d(true, true, false) },
  { key: "apps.edit", label: "Sửa hồ sơ / đổi trạng thái (mọi trạng thái)", group: "Thao tác hồ sơ", defaults: d(true, false, false) },
  { key: "apps.offer", label: "Chuyển Interview → Offer & ghi kết quả offer", group: "Thao tác hồ sơ", defaults: d(true, false, true) },
  { key: "apps.delete", label: "Xoá hồ sơ", group: "Thao tác hồ sơ", defaults: d(true, false, false) },
  { key: "interviews.manage", label: "Tạo / sửa lịch PV, upload & phân tích ghi âm", group: "Phỏng vấn & mail", defaults: d(true, false, false) },
  { key: "emails.send", label: "Gửi mail ứng viên (mời PV, bài test, báo trượt…)", group: "Phỏng vấn & mail", defaults: d(true, false, false) },
  { key: "emails.send_offer", label: "Gửi mail offer", group: "Phỏng vấn & mail", defaults: d(true, false, true) },
  { key: "emails.templates", label: "Xem & sửa mẫu mail", group: "Phỏng vấn & mail", defaults: d(true, false, true) },
  { key: "jobs.manage", label: "Quản lý job, bài test, trạng thái pipeline, quy tắc xếp hạng", group: "Job & hệ thống", defaults: d(true, false, false) },
  { key: "jobs.assign_leader", label: "Gán Leader cho job", group: "Job & hệ thống", defaults: d(true, false, false) },
  { key: "ai.run", label: "Chạy AI chấm / xếp hạng / tìm kiếm AI", group: "Job & hệ thống", defaults: d(true, false, false) },
  { key: "push.receive", label: "Nhận thông báo đẩy nhắc lịch PV", group: "Job & hệ thống", defaults: d(true, true, false) },
] as const satisfies readonly PermissionDef[];

export type PermissionKey = (typeof HR_PERMISSIONS)[number]["key"];

const KEYS: ReadonlySet<string> = new Set(HR_PERMISSIONS.map((p) => p.key));

export function isPermissionKey(v: unknown): v is PermissionKey {
  return typeof v === "string" && KEYS.has(v);
}

/** Boss luôn có mọi quyền. Vai khác = mặc định, ghi đè bởi bảng hr_role_permissions. */
export function effectivePermissions(
  role: HrRole,
  overrides: { role: string; permission: string; allowed: boolean }[],
): Set<PermissionKey> {
  if (role === "boss") return new Set(HR_PERMISSIONS.map((p) => p.key));
  const out = new Set<PermissionKey>();
  for (const p of HR_PERMISSIONS) if (p.defaults[role]) out.add(p.key);
  for (const o of overrides) {
    if (o.role !== role || !isPermissionKey(o.permission)) continue;
    if (o.allowed) out.add(o.permission);
    else out.delete(o.permission);
  }
  return out;
}

/** Cổng chuyển tiếp: route chưa chuyển sang requireHrUser(perm) vẫn toàn quyền, nên chỉ boss/hr được qua. */
export function legacyRouteAllowed(role: HrRole): boolean {
  return role === "boss" || role === "hr";
}
