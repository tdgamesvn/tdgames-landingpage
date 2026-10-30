/**
 * Poster (khung đầu, JPG ~40–90 KB) cho video hero trang chủ. Video hero do sếp chọn ở
 * /admin (page_slots home/hero-carousel) nên DB không có cột poster → tra theo URL video.
 * Có cả URL gốc lẫn bản nén lại landing/video/hero-v2/*.mp4 (≈2 MB) để đổi slot sang bản
 * nén thì poster vẫn ăn. Video không có trong map → không poster (như trước).
 * Thêm video mới: `ffmpeg -i v.mp4 -frames:v 1 -q:v 4 p.jpg`, upload key mới
 * landing/video/posters/<tên>.jpg (scripts/upload-r2-new-keys.mjs), thêm dòng vào đây.
 */
const CDN = "https://cdn.tdgamestudio.com";
const P = (name: string) => `${CDN}/landing/video/posters/${name}.jpg`;

const SOURCES: Record<string, string[]> = {
  "summoner-era-cutscene": ["projects/2026/05/7759fd39-7e30-46a3-ad1d-68a71255ffad-cutscene_full_zip.mp4"],
  "3q-cutscene": ["projects/2026/05/97c5a6d5-fe56-4336-b547-9f2f8f4a0353-full_zip.mp4"],
  "yomi-2-supermove": ["projects/2026/06/0f5e4297-672e-4e65-bca2-a1937f8dc479-supermove_2_compressed_compressed.mp4"],
  mytheria: ["projects/2026/06/0da9b59d-798f-4f5f-b2e3-9c4f05a4daa6-thantich_compressed.mp4"],
  "horse-race": ["projects/2026/06/2a5fe03a-03a1-4ca7-8617-d5d16d4e5194-hourse_compressed.mp4"],
};

const POSTERS = new Map<string, string>(
  Object.entries(SOURCES).flatMap(([name, keys]) =>
    [...keys, `landing/video/hero-v2/${name}.mp4`].map((k) => [`${CDN}/${k}`, P(name)] as const),
  ),
);

export function posterFor(videoUrl: string | undefined | null): string | undefined {
  if (!videoUrl) return undefined;
  return POSTERS.get(videoUrl.split("?")[0]);
}
