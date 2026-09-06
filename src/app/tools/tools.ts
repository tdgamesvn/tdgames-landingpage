// ponytail: một mảng literal là toàn bộ "registry". Thêm tool = thêm 1 object ở đây
// + 1 thư mục src/app/tools/<slug>/. Không plugin loader, không DB, không config.
// Khi nào có 5+ tool live và mảng này thành gánh nặng thật thì mới chuyển sang DB.

export type Tool = {
  slug: string;
  name: string;
  blurb: string;
  tag: "Image" | "Spine" | "VFX";
  status: "live" | "coming-soon";
  /**
   * browser = chạy 100% trên máy user → free vô hạn, không đếm được lượt dùng.
   * server  = chạy trên worker (Mac mini) → tốn tiền, sau này phải có login + quota.
   */
  runsOn: "browser" | "server";
};

export const TOOLS: Tool[] = [
  {
    slug: "image-compressor",
    name: "Image Compressor",
    blurb:
      "Nén PNG/JPG/WebP xuống dung lượng nhỏ nhất mà mắt không thấy khác biệt. Ảnh không rời khỏi máy bạn.",
    tag: "Image",
    status: "coming-soon",
    runsOn: "browser",
  },
  {
    slug: "image-upscaler",
    name: "AI Image Upscaler",
    blurb:
      "Phóng to concept art, sprite, texture lên 2x–4x bằng AI mà vẫn giữ nét, không bị bệt.",
    tag: "Image",
    status: "coming-soon",
    runsOn: "server",
  },
  {
    slug: "spine-auto-rig",
    name: "Spine Auto Rig & Mesh",
    blurb:
      "Tự động dựng bone và mesh cho nhân vật 2D, cắt bớt phần setup tay tốn thời gian nhất của khâu rig.",
    tag: "Spine",
    status: "coming-soon",
    runsOn: "server",
  },
  {
    slug: "vfx-exporter",
    name: "VFX Sprite Sheet Exporter",
    blurb:
      "Đóng gói hiệu ứng thành sprite sheet chuẩn engine, kèm file atlas, sẵn sàng thả vào Unity hoặc Unreal.",
    tag: "VFX",
    status: "coming-soon",
    runsOn: "server",
  },
];
