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
  // Cover cũ chỉ là logo "The Twins" → AI bịa ra sư tử + thú vàng. Lấy frame thật của
  // con boss từ video Vimeo trong bài (thumbnail oEmbed, d_1280).
  ["boss-animation", [
    "https://i.vimeocdn.com/video/1510105572-aa66966e985b1196479af07a06a76e148bd2164fdb4e86e89cd67ac09f78015b-d_1280?region=us",
    "https://i.vimeocdn.com/video/1510105605-0954841163950b7f9a885f35044c89b306f89809df1aec80949bffeace55f3b8-d_1280?region=us",
    // v4 (sếp: v3 "chưa ấn tượng, chưa dynamic") — tả khoảnh khắc ra đòn + góc máy,
    // không thêm particle: chuyển động nằm ở pose, phối cảnh và 1 vệt chém đồ hoạ.
    // v5 (sếp): v4 vẽ chuôi một tay, lưỡi một tay — sai. Kiếm là MỘT khối liền,
    // to → cầm HAI tay. Xích liềm treo thắt lưng để AI khỏi tách thành vật thứ hai.
  ], "the green-skinned oni ninja boss from The Twins — red horned mask, wild black hair, crimson armour — wielding ONE giant curved golden greatsword: a single continuous weapon where the long wrapped hilt connects directly into the blade, held with BOTH hands together gripping the hilt, both fists stacked on the same handle; his chain-sickle hangs coiled at his belt, not in his hands. Pose: a powerful low lunging two-handed horizontal sweep — he drives forward in a deep wide stance, torso twisted, both hands gripping the hilt at chest height in front of his body, the long blade sweeping across the frame diagonally in front of him; arms are NOT raised above the head. Correct anatomy: head clearly above the shoulders, two arms each attached at the shoulders, upper arm and forearm with a natural elbow bend, both arms reaching forward to the same hilt. Seen from a slightly low three-quarter angle with mild foreshortening so the blade reaches toward the viewer; his hair and loincloth whip back with the motion; one bold graphic crescent slash trail in crimson follows the blade, a few sharp cartoon speed lines and a chunky ground-crack shockwave under his planted front foot; glaring eyes, snarling mouth; backdrop a deep crimson to near-black diagonal gradient with a huge pale blood-moon disc behind his head for silhouette; he is the only character"],
  ["horse-racing", `${CDN}/portfolio-covers/horse-racing.jpg`, "splash art of racing horses and riders in full gallop, motion and speed"],
  ["battle-of-the-gods-mytheria", `${CDN}/portfolio-covers/battle-of-the-gods-mytheria.png`, "epic clash of gods from Mytheria, login screen grandeur"],
  ["animation-contest-sky-mavis", `${CDN}/portfolio-covers/animation-contest-sky-mavis.png`, "Axie characters from the Sky Mavis animation contest entry in an energetic action beat"],
  ["reaper-lady-project-overdrive", `${CDN}/portfolio-covers/reaper-lady-project-overdrive.png`, "the Reaper and the Lady characters from Project OverDrive in a stylish duo pose"],
  ["lore-axie-origin", `${CDN}/portfolio-covers/lore-axie-origin.png`, "cinematic lore moment from the Axie Origin world, storytelling mood"],
  ["mid-autumn-summoner-era", `${CDN}/portfolio-covers/mid-autumn-summoner-era.jpg`, "Mid-Autumn festival scene with Summoner Era heroes, lanterns and full moon"],
  ["puzzle-wonderland", `${CDN}/portfolio-covers/puzzle-wonderland.png`, "whimsical Puzzle Wonderland characters in a playful animated pose"],
  ["summoner-era-2020", `${CDN}/portfolio-covers/summoner-era-2020.jpg`, "Summoner Era login screen heroes, grand fantasy splash composition"],
  // v2 cũ (ref gwen-desperation, Gwen ngã ngửa) — sếp chê không ấn tượng. Lấy frame
  // super-move thật; "slug@biến-thể" để thử nhiều chủ thể, file ra vẫn là yomi-2.png.
  ["yomi-2@gwen", [`${CDN}/portfolio/yomi-2/gwen-ice-shards.jpg`, `${CDN}/portfolio/yomi-2/gwen-desperation.jpg`],
    "GWEN from Yomi 2 — blue-skinned assassin in a red-brown hood with glowing yellow eyes, a long golden braid, teal wraps and white clawed gauntlets — diving head-first straight down toward the viewer out of the sky at the peak of her Ice Shards super move, extreme high-to-low foreshortening so one clawed hand reaches huge into the foreground, her braid whipping behind her in a long S-curve; a ring of big sharp ice shards bursting outward around her as the one signature effect, drawn as bold flat cartoon shapes, plus bold radial anime speed lines converging on her; correct anatomy: head between the shoulders, two arms, two legs; backdrop deep teal to navy radial burst"],
  ["yomi-2@onimaru", [`${CDN}/portfolio/yomi-2/onimaru-clockwork-soldiers.jpg`, `${CDN}/portfolio/yomi-2/onimaru-martial-law.jpg`],
    "ONIMARU from Yomi 2 — a stocky samurai warlord in red lacquered armour with gold trim, horned kabuto helmet and a huge broad-bladed sword — charging straight at the viewer in a low wide-angle shot, the broad sword held in both hands at his side in a horizontal two-handed grip ready to cleave (NOT raised overhead), armour plates and cape flaring back with the speed; one signature effect only: a bold flat orange flame slash trail sweeping across the frame behind the blade, plus bold anime speed lines; correct anatomy: head above the shoulders, both arms attached at the shoulders; backdrop a hot orange to deep red radial burst"],
  // Nguồn là screenshot in-game có UI → dùng nhiều frame skill để AI thấy rõ nhân vật,
  // dặn bỏ hết UI. Bản v2 đầu (từ magic-orb.jpg) ra cô bé đứng trên đá lơ lửng, xấu.
  ["epic-card", [
    `${CDN}/portfolio/epic-card/debuff-immunity.jpg`,
    `${CDN}/portfolio/epic-card/shield-invincibility.jpg`,
    `${CDN}/portfolio/epic-card/magic-orb.jpg`,
    // v4: thêm động tác + góc nghiêng + "card" làm motif để ra đúng chất Epic Card.
  ], "the white-haired chibi heroine in a grey gothic dress from the Epic Card battle captures, large in frame, mid-air in a dynamic twisting spell-casting leap toward the viewer, one arm thrust forward with her staff, long hair and dress flaring in a sweeping S-curve; camera tilted at a dutch angle from slightly below; a fan of three oversized glowing trading cards bursts out of her outstretched hand and spins toward the camera with motion blur, the nearest card huge in the foreground; golden angel wings of light snap open behind her and a crisp blue shield ring slices diagonally through the frame — those effects only, drawn as bold flat cartoon shapes; backdrop a simplified moonlit gothic ruin hall in cool blue with a strong diagonal shaft of light; drop every UI element (no HP bar, no portraits, no buttons, no card text)"],
  // Quái chỉ có ID (khách không đặt tên). Lấy 3013 (quỷ có cánh) làm chủ thể — dáng
  // xoè cánh đọc rõ nhất ở thumbnail; 3008 + 3010 làm mẫu chung cho art style.
  ["stickman-legend", [
    "https://cdn.tdgamestudio.com/landing/portfolio/stickman-legend/3013_skill_02.jpg",
    "https://cdn.tdgamestudio.com/landing/portfolio/stickman-legend/3013_idle.jpg",
    "https://cdn.tdgamestudio.com/landing/portfolio/stickman-legend/3010_skill_02.jpg",
  ], "the black winged demon monster from the first reference — jet-black body, huge tattered bat wings spread wide, white curved horns, crimson markings on face and chest — rearing up in a menacing roar toward the viewer with wings fully open, seen from a slightly low angle; keep its flat black-and-crimson silhouette style exactly; he is the only character; one bold graphic crimson energy shape behind him; backdrop a deep crimson to near-black gradient with a large pale moon disc behind the wings for silhouette"],
  // A002 casual roster: 3 nhân vật + 1 pet, nền pastel sáng — khác tông tối của cả bộ có chủ đích (sếp muốn tươi sáng).
  ["chibi-heroes-pets", ["https://cdn.tdgamestudio.com/landing/portfolio/chibi-heroes-pets/char_17_idle.jpg", "https://cdn.tdgamestudio.com/landing/portfolio/chibi-heroes-pets/hero_31_idle.jpg", "https://cdn.tdgamestudio.com/landing/portfolio/chibi-heroes-pets/pet_3_idle.jpg"],
    "a cheerful group shot of the chibi cast from the references: the red-scarf ninja with twin curved blades in the centre front, the blonde knight girl with her oversized sword on one side, and the orange Shiba pup bouncing at their feet; big heads, tiny bodies, thick dark outlines, exactly the same cute casual art style; all three posed happily toward the viewer as if ready for adventure; backdrop a bright soft sky-blue to pastel lavender gradient with a few simple chunky white clouds — light, sunny and playful, NOT dark"],
];

async function gen([slug, src, content]) {
  const t0 = Date.now();
  const srcs = Array.isArray(src) ? src : [src];
  const form = new FormData();
  form.set("model", MODEL);
  form.set("size", "1536x1024");
  form.set("prompt", `${RULES}. Subject of this portfolio piece: ${content}.`);
  for (const [i, u] of srcs.entries()) {
    const ref = await fetch(u);
    if (!ref.ok) return console.error(`✗ ${slug}: tải ảnh nguồn ${ref.status} ${u}`);
    // Ảnh nguồn lẫn jpg/png, có ảnh 404px — chuẩn hoá về PNG để /images/edits nhận.
    const png = await sharp(Buffer.from(await ref.arrayBuffer())).png().toBuffer();
    // 1 ảnh: field `image` như cũ; nhiều ảnh: `image[]` (OpenAI multi-reference).
    form.append(srcs.length > 1 ? "image[]" : "image", new Blob([png], { type: "image/png" }), `${slug}-${i}.png`);
  }

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
  await writeFile(`${OUT}/${slug.split("@")[0]}.png`, out);
  console.log(`✓ ${slug}\t${OUT}/${slug.split("@")[0]}.png\t${Math.round((Date.now() - t0) / 1000)}s`);
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
