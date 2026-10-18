// Sinh nền sân khấu (đấu trường trống) cho trang Monster Legends từng hệ, lấy
// SplashArt của game làm tham chiếu phong cách để nền ăn khớp art gốc của khách.
//
//   node --env-file=.env.local scripts/gen-monster-legends-bg.mjs Fire            # gen → scripts/.out/
//   node --env-file=.env.local scripts/gen-monster-legends-bg.mjs Fire --upload   # + đẩy R2 arena.webp
//
// ponytail: chỉ dùng AI cho NỀN, nhân vật luôn là Spine thật của khách (DECISIONS 2026-10-15:
// AI không được đóng vai sản phẩm studio làm). Thêm hệ mới = thêm 1 dòng vào SCENES.
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const BASE = (process.env.AI_BASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_IMAGE_MODEL || "gpt-image-2";
if (!BASE || !KEY) throw new Error("AI_BASE_URL / AI_API_KEY chưa có trong .env.local");

const [element, ...flags] = process.argv.slice(2);
const SCENES = {
  Water: "a calm tidal lagoon at twilight: one large, flat, round platform of smooth wet blue-grey stone fills the lower half, a thin film of shallow water in its cracks catching soft teal reflections; far behind, misty sea stacks and low cliffs fade into haze over still water; a dim deep-blue to teal sky with soft clouds; no crashing waves, no boats, no bright hotspots",
  Fire: "a quiet volcanic plateau at dusk: one large, flat, round platform of dark cracked basalt fills the lower half, with only thin faint glowing ember lines in its cracks; far behind, low desaturated volcano silhouettes fade into haze; a dim smoky plum-to-ember sky; very little lava, no waterfalls, no floating rocks, no bright hotspots",
};
if (!SCENES[element]) throw new Error(`Chưa có scene cho hệ "${element}". Có: ${Object.keys(SCENES)}`);

// v3 (sếp 2026-10-18): v2 trông "real" quá, lệch style hero → ép hẳn sang cartoon.
const PROMPT = `Match the reference image's ART STYLE exactly: Monster Legends mobile-game cartoon environment art — stylised, hand-painted 2D illustration with simplified chunky shapes, bold readable silhouettes, rounded exaggerated rock forms, clean soft gradients and crisp painted edges, saturated harmonious colours. It must read clearly as a cartoon game background, NOT a photo: no photorealism, no realistic rock or water textures, no fine noise or grain, no realistic lighting, no 3D render look. Paint a completely EMPTY background environment — ${SCENES[element]}. Absolutely NO monsters, NO creatures, NO characters, NO people, NO text, NO logo, NO UI. Keep it calm and low-detail so it stays BEHIND a character: slightly darker and less saturated than the reference, soft simple shapes in the distance. Wide 3:2 shot from a slightly raised camera, horizon at about 42% height. The platform's flat open centre spot sits at 50% width and 68% height of the image — a monster will be composited standing there, so keep it empty, flat and a little lighter, like a soft pool of light on the ground. Edges darker. Full-bleed, no borders.`;
// Tâm sàn trong ảnh (tỉ lệ chiều cao) — SpineStage đặt chân quái vào đúng điểm này.
// Gen lại nền thì đo lại và sửa groundY ở project-data.
const VERSION = "v3";

const OUT = "scripts/.out/monster-legends";
const file = `${OUT}/${element.toLowerCase()}-arena-${VERSION}.png`;

async function gen() {
  const ref = await sharp("media-inbox/Monster Legend/Logo/SplashArt.jpg")
    .resize(1536, 1024, { fit: "cover" })
    .png()
    .toBuffer();
  const form = new FormData();
  form.set("model", MODEL);
  form.set("size", "1536x1024");
  form.set("prompt", PROMPT);
  form.append("image", new Blob([ref], { type: "image/png" }), "ref.png");
  const res = await fetch(`${BASE}/images/edits`, {
    method: "POST",
    headers: { authorization: `Bearer ${KEY}` },
    body: form,
    signal: AbortSignal.timeout(300_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  const b64 = (await res.json())?.data?.[0]?.b64_json;
  if (typeof b64 !== "string") throw new Error("không có b64_json");
  const buf = Buffer.from(b64, "base64");
  await mkdir(OUT, { recursive: true });
  await writeFile(file, buf);
  const m = await sharp(buf).metadata();
  console.log(`✓ ${file} ${m.width}×${m.height}`);
}

if (!flags.includes("--upload")) await gen();
else {
  const webp = await sharp(await readFile(file)).webp({ quality: 84 }).toBuffer();
  const Key = `landing/portfolio/monster-legends-${element.toLowerCase()}/arena-${VERSION}.webp`;
  await new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  }).send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key,
      Body: webp,
      ContentType: "image/webp",
      CacheControl: "public, max-age=86400",
    }),
  );
  console.log(`↑ ${Key} ${(webp.length / 1e6).toFixed(2)}MB`);
}
