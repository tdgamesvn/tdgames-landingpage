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
      "Squeeze PNG/JPG/WebP down to the smallest size your eye can't tell apart. Images never leave your machine.",
    tag: "Image",
    status: "coming-soon",
    runsOn: "browser",
  },
  {
    slug: "image-upscaler",
    name: "AI Image Upscaler",
    blurb:
      "Upscale concept art, sprites and textures 2x–4x with AI — sharp edges, no mushy blur.",
    tag: "Image",
    status: "coming-soon",
    runsOn: "server",
  },
  {
    slug: "spine-auto-rig",
    name: "Spine Auto Rig & Mesh",
    blurb:
      "Auto-generate bones and meshes for 2D characters, cutting the slowest manual setup out of rigging.",
    tag: "Spine",
    status: "coming-soon",
    runsOn: "server",
  },
  {
    slug: "vfx-exporter",
    name: "VFX Sprite Sheet Exporter",
    blurb:
      "Pack effects into engine-ready sprite sheets with an atlas file, ready to drop into Unity or Unreal.",
    tag: "VFX",
    status: "coming-soon",
    runsOn: "server",
  },
];
