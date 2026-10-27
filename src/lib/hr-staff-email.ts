// Mail gửi nhân viên /hr (mời, đặt lại mật khẩu) — phần thuần, không I/O.

const SIGNATURE = ["Trân trọng,", "TD Games Studio — Phòng Nhân sự", "https://tdgamestudio.com · hr@tdgamestudio.com"].join("\n");

export function buildStaffInviteEmail(input: {
  displayName: string;
  roleLabel: string;
  link: string;
  invitedBy: string;
}): { subject: string; text: string } {
  const name = input.displayName.trim() || "bạn";
  const by = input.invitedBy.trim();
  const text = [
    `Chào ${name},`,
    `${by ? `${by} đã mời bạn` : "Bạn được mời"} vào TD Games HR với vai trò ${input.roleLabel}. Bấm vào link dưới đây để đặt mật khẩu và đăng nhập:`,
    input.link,
    "Link có hiệu lực 7 ngày và chỉ dùng được một lần.",
    SIGNATURE,
  ].join("\n\n");
  return { subject: "Mời bạn vào TD Games HR", text };
}

export function buildPasswordResetEmail(input: { displayName: string; link: string }): { subject: string; text: string } {
  const name = input.displayName.trim() || "bạn";
  const text = [
    `Chào ${name},`,
    "Chúng mình nhận được yêu cầu đặt lại mật khẩu TD Games HR cho tài khoản của bạn. Bấm vào link dưới đây để đặt mật khẩu mới:",
    input.link,
    "Link có hiệu lực 1 giờ và chỉ dùng được một lần. Nếu bạn không yêu cầu, hãy bỏ qua email này.",
    SIGNATURE,
  ].join("\n\n");
  return { subject: "Đặt lại mật khẩu TD Games HR", text };
}
