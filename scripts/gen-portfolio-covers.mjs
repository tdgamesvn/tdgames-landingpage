// Làm lại ảnh bìa list /portfolio bằng gpt-image qua cliproxyapi — NHƯNG lấy ảnh bìa
// thật làm ảnh tham chiếu (/images/edits), không vẽ mới từ chữ. Portfolio là sản phẩm
// studio làm cho khách: nhân vật, thiết kế, art style phải là của bài đó, AI chỉ được
// dựng lại bố cục / ánh sáng / nền / độ nét cho 17 bìa đứng cạnh nhau trông cùng một bộ.
//
// Usage (cần cliproxyapi ở localhost:8317; chạy ngoài sandbox vì sandbox chặn localhost):
//   node --env-file=.env.local scripts/gen-portfolio-covers.mjs                # tất cả
//   node --env-file=.env.local scripts/gen-portfolio-covers.mjs heroes-fire    # 1+ slug
//
// Chỉ ghi ra file preview ở scripts/.out/portfolio-covers/<slug>.png — KHÔNG upload R2,
// KHÔNG đụng DB. Sếp duyệt xong mới upload + UPDATE projects SET image = ...
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const BASE = (process.env.AI_BASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_IMAGE_MODEL || "gpt-image-2";
if (!BASE || !KEY) throw new Error("AI_BASE_URL / AI_API_KEY chưa có trong .env.local");

const OUT = `scripts/.out/portfolio-covers${process.env.VARIANT ? `/${process.env.VARIANT}` : ""}`;
const CDN = "https://cdn.tdgamestudio.com/landing";

// Khung chung cho cả bộ. List /portfolio hiển thị 3:2 (thumb 96x64 + preview lớn khi
// hover) → xin 1536x1024, chủ thể ở giữa để thumb nhỏ vẫn đọc được.
// v2 (sếp 2026-10-12): bản v1 "cinematic lighting / atmospheric background" ra kiểu
// AI slop — dung nham, hạt lửa, glow phủ kín khung. Sếp muốn cartoon hơn, ÍT màu mè:
// cel shading phẳng, outline sạch, nền đơn giản, khoảng thở rộng.
const RULES =
  "Use the attached image as the reference: keep the SAME characters, character designs, costumes and colour identity — do not redesign or replace anyone, do not turn it into 3D or photo-real. " +
  "Redraw it as a clean cartoon game illustration: bold clean outlines, flat cel shading with at most two tone steps, simple graphic shapes, slightly chunkier cartoon proportions, restrained limited palette. " +
  "Composition: one clear focal subject (or a small tight group) centred, strong readable silhouette that works as a tiny thumbnail, landscape 3:2 framing with lots of breathing room. " +
  "Background: a simple flat or softly graded single-colour backdrop with at most one or two big simple shapes hinting at the setting — no detailed scenery. " +
  "Keep it calm and tidy: NO sparkles, NO floating particles, NO embers, NO bokeh, NO lens flare, NO glow haze filling the frame, NO ornate filigree, NO extra swirling effects beyond the one signature effect of the piece, no painterly texture, no hyper-detailed rendering. " +
  "Absolutely no text, no logos, no UI, no watermarks, no borders or frames";

// [slug, ảnh nguồn, nội dung bài — để AI biết nhấn vào đâu]
const PROJECTS = [
  ["heroes-fire", `${CDN}/portfolio-covers/heroes-fire.png`, "fire-element heroes from Summoner Era casting skills, emphasise flame VFX and dynamic action pose"],
  ["summoner-era-arena-of-heroes", `${CDN}/portfolio-covers/summoner-era-arena-of-heroes.png`, "Summoner Era arena heroes in a heroic battle-ready animation pose"],
  ["game-animation-vfx-3q", `${CDN}/portfolio-covers/game-animation-vfx-3q.png`, "Three Kingdoms warrior heroes performing a skill with bold VFX"],
  ["kayn-snow-moon", `${CDN}/images/Screenshot%202026-05-13%20232709.png`, "Snow Moon Kayn login screen illustration, moonlit snowy atmosphere, keep the splash composition feel"],
  ["summoner-era", `${CDN}/images/summonerDetail.png`, "light and dark element heroes of Summoner Era, contrast of holy light and shadow VFX"],
  ["axie-infinity-origins", `${CDN}/portfolio-covers/axie-infinity-origins.png`, "cute Axie creatures in a lively battle animation moment"],
  ["boss-animation", `${CDN}/portfolio-covers/boss-animation.png`, "the twin bosses as an imposing boss-fight showcase"],
  ["horse-racing", `${CDN}/portfolio-covers/horse-racing.jpg`, "splash art of racing horses and riders in full gallop, motion and speed"],
  ["battle-of-the-gods-mytheria", `${CDN}/portfolio-covers/battle-of-the-gods-mytheria.png`, "epic clash of gods from Mytheria, login screen grandeur"],
  ["animation-contest-sky-mavis", `${CDN}/portfolio-covers/animation-contest-sky-mavis.png`, "Axie characters from the Sky Mavis animation contest entry in an energetic action beat"],
  ["reaper-lady-project-overdrive", `${CDN}/portfolio-covers/reaper-lady-project-overdrive.png`, "the Reaper and the Lady characters from Project OverDrive in a stylish duo pose"],
  ["lore-axie-origin", `${CDN}/portfolio-covers/lore-axie-origin.png`, "cinematic lore moment from the Axie Origin world, storytelling mood"],
  ["mid-autumn-summoner-era", `${CDN}/portfolio-covers/mid-autumn-summoner-era.jpg`, "Mid-Autumn festival scene with Summoner Era heroes, lanterns and full moon"],
  ["puzzle-wonderland", `${CDN}/portfolio-covers/puzzle-wonderland.png`, "whimsical Puzzle Wonderland characters in a playful animated pose"],
  ["summoner-era-2020", `${CDN}/portfolio-covers/summoner-era-2020.jpg`, "Summoner Era login screen heroes, grand fantasy splash composition"],
  ["yomi-2", `${CDN}/portfolio/yomi-2/gwen-desperation.jpg`, "fighting-game super-move cutscene moment, intense dramatic framing"],
  ["epic-card", `${CDN}/portfolio/epic-card/magic-orb.jpg`, "a glowing magic orb card VFX, arcane energy swirling"],
];

async function gen([slug, src, content]) {
  const t0 = Date.now();
  const ref = await fetch(src);
  if (!ref.ok) return console.error(`✗ ${slug}: tải ảnh nguồn ${ref.status}`);
  // Ảnh nguồn lẫn jpg/png, có ảnh 404px — chuẩn hoá về PNG để /images/edits nhận.
  const png = await sharp(Buffer.from(await ref.arrayBuffer())).png().toBuffer();

  const form = new FormData();
  form.set("model", MODEL);
  form.set("size", "1536x1024");
  form.set("prompt", `${RULES}. Subject of this portfolio piece: ${content}.`);
  form.set("image", new Blob([png], { type: "image/png" }), `${slug}.png`);

  let json;
  try {
    const res = await fetch(`${BASE}/images/edits`, {
      method: "POST",
      headers: { authorization: `Bearer ${KEY}` },
      body: form,
      signal: AbortSignal.timeout(240_000),
    });
    if (!res.ok) return console.error(`✗ ${slug}: ${res.status} ${(await res.text()).slice(0, 200)}`);
    json = await res.json();
  } catch (e) {
    return console.error(`✗ ${slug}: ${e.name} ${e.message}`);
  }
  const b64 = json?.data?.[0]?.b64_json;
  if (typeof b64 !== "string") return console.error(`✗ ${slug}: không có b64_json`);

  // Backend hay phớt lờ `size` → ép đúng 1536x1024. `cover` (không phải contain như
  // ai-image.ts) vì ở đây AI đã dựng khung ngang, chỉ lệch vài px, không muốn viền đen.
  const out = await sharp(Buffer.from(b64, "base64"))
    .resize(1536, 1024, { fit: "cover", position: "attention" })
    .png()
    .toBuffer();
  await writeFile(`${OUT}/${slug}.png`, out);
  console.log(`✓ ${slug}\t${OUT}/${slug}.png\t${Math.round((Date.now() - t0) / 1000)}s`);
}

const only = process.argv.slice(2);
const list = PROJECTS.filter(([s]) => !only.length || only.includes(s));
if (!list.length) {
  console.error(`Không khớp slug nào. Có: ${PROJECTS.map(([s]) => s).join(", ")}`);
  process.exit(1);
}
await mkdir(OUT, { recursive: true });
// 3 request một lượt — backend ảnh hay 429 nếu bắn hết cùng lúc (y gen-job-covers).
for (let i = 0; i < list.length; i += 3) await Promise.all(list.slice(i, i + 3).map(gen));
