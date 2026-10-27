// Loại file đề test / bài làm (thuần, dùng được trong test).
// KHÔNG tin content type trình duyệt gửi lên: suy từ đuôi file theo danh sách cho phép.
// Cố ý bỏ svg/html/htm/xml/js — các loại chạy được script khi mở trên cdn.tdgamestudio.com.

const OCTET = "application/octet-stream";

const TYPE_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  tar: "application/x-tar",
  gz: "application/gzip",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain; charset=utf-8",
  md: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json",
  psd: OCTET,
  psb: OCTET,
  ai: OCTET,
  fig: OCTET,
  sketch: OCTET,
  xd: OCTET,
  blend: OCTET,
  fbx: OCTET,
  obj: OCTET,
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
  unitypackage: OCTET,
  atlas: "text/plain; charset=utf-8",
  skel: OCTET,
  spine: OCTET,
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
};

/** Content type lưu R2 cho file `name`; null = đuôi không được phép. */
export function testFileContentType(name: string): string | null {
  const m = /\.([a-z0-9]+)$/i.exec(name || "");
  if (!m) return null;
  const ext = m[1].toLowerCase();
  return Object.prototype.hasOwnProperty.call(TYPE_BY_EXT, ext) ? TYPE_BY_EXT[ext] : null;
}
