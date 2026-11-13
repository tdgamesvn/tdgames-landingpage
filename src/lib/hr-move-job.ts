// Đổi vị trí ứng tuyển của 1 hồ sơ (vd. apply 2D Game Artist → chuyển sang Graphic Designer).
// Đề test, chấm AI, phạm vi Leader, hoa hồng đều theo job_id → luật chặn gom ở đây cho dễ test.

export type MoveJobCheck = {
  role: string;
  canEdit: boolean;
  currentJobId: string;
  targetJobId: string;
  targetExists: boolean;
  /** Ứng viên (cùng email) đã có hồ sơ khác ở job đích. */
  duplicateInTarget: boolean;
  /** Số khoản hoa hồng chưa huỷ của hồ sơ. */
  openPayouts: number;
};

export type MoveJobDenial = { status: number; error: string };

/** null = được đổi. Chỉ Sếp/HR (thấy mọi job) — Leader đổi đi là mất quyền xem hồ sơ. */
export function moveJobDenial(c: MoveJobCheck): MoveJobDenial | null {
  if (!c.canEdit || (c.role !== "boss" && c.role !== "hr")) {
    return { status: 403, error: "Chỉ Sếp/HR được đổi vị trí ứng tuyển" };
  }
  if (!c.targetExists) return { status: 400, error: "Vị trí mới không tồn tại" };
  if (c.targetJobId === c.currentJobId) return { status: 400, error: "Hồ sơ đang ở đúng vị trí này" };
  if (c.duplicateInTarget) {
    return { status: 409, error: "Ứng viên đã có hồ sơ khác ở vị trí này — mở hồ sơ đó thay vì chuyển" };
  }
  if (c.openPayouts > 0) {
    return { status: 409, error: "Hồ sơ đã có khoản hoa hồng giới thiệu — nhờ Kế toán xử lý trước khi đổi vị trí" };
  }
  return null;
}

/** Bình luận ghi lại việc đổi vị trí (hiện trong cột Bình luận của hồ sơ). */
export function moveJobComment(fromTitle: string, toTitle: string, hadAiScore: boolean): string {
  const ai = hadAiScore ? " Điểm AI cũ (chấm theo JD cũ) đã xoá — bấm \"Chấm bằng AI\" để chấm lại." : "";
  return `🔀 Đã chuyển vị trí ứng tuyển: ${fromTitle} → ${toTitle}. Link test từ giờ mở đề của ${toTitle}; bài đã nộp vẫn giữ.${ai}`;
}

/** Escape ký tự đại diện của ILIKE để so email chính xác (không phân biệt hoa thường). */
export function escapeIlike(s: string): string {
  return s.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
