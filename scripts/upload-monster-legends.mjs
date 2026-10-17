// Đẩy Spine nhân vật Monster Legends (khách Social Point) lên R2 cho trang case study
// từng hệ. Nguồn: media-inbox/Monster Legend/<Hệ>/<quái>/<quái>_<bậc>/{.json,.atlas,.png}.
//
//   node --env-file=.env.local scripts/upload-monster-legends.mjs Fire            # dry-run
//   node --env-file=.env.local scripts/upload-monster-legends.mjs Fire --apply    # upload
//
// → landing/portfolio/monster-legends-<hệ>/spine/<quái>/<bậc>.{json,atlas,webp}
//   + logo.webp, splash.jpg ở gốc prefix. In manifest (quái → bậc → animations) ra stdout.
//
// Sếp chốt 2026-10-17: bỏ fx_ultimate + avatar, chỉ show nhân vật. Bậc: _1 → stage1,
// _3 → stage3, thư mục con bắt đầu bằng "awakened" → awakened (bậc cao nhất).
// ponytail: atlas PNG → WebP q90 + alpha lossless — 7.9MB còn 1.5MB. Texture là PMA,
// nén lossy kênh màu có thể làm viền sáng nhẹ ở mép mờ; nếu thấy thì chuyển lossless (~3.9MB).
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [element, ...flags] = process.argv.slice(2);
if (!element) throw new Error("Thiếu tên hệ, vd: Fire");
const APPLY = flags.includes("--apply");
const ROOT = "media-inbox/Monster Legend";
const SRC = path.join(ROOT, element);
const PREFIX = `landing/portfolio/monster-legends-${element.toLowerCase()}`;
const SKIP = new Set(["avatar", "fx_ultimate"]);

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

let bytes = 0;
async function put(key, body, type) {
  bytes += body.length;
  console.error(`${APPLY ? "↑" : "·"} ${key}  ${(body.length / 1e6).toFixed(2)}MB`);
  if (!APPLY) return;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: `${PREFIX}/${key}`,
      Body: body,
      ContentType: type,
      CacheControl: "public, max-age=86400",
    }),
  );
}

// "awakened-architect-fire-kaih-the-pyrenaut_3" → { id: "kaih-the-pyrenaut", tier: "awakened" }
function parse(dir) {
  const name = dir.toLowerCase();
  const tier = name.startsWith("awakened")
    ? "awakened"
    : name.endsWith("_1")
      ? "stage1"
      : "stage3";
  const id = name
    .replace(/_\d+$/, "")
    .replace(/^(concept-)?(awakened-)?/, "")
    .replace(new RegExp(`^(mythic|architect|ancestor)-${element.toLowerCase()}-`), "");
  return { id, tier };
}

const manifest = {};
for (const monster of (await readdir(SRC)).sort()) {
  if (monster.startsWith(".") || !(await stat(path.join(SRC, monster))).isDirectory()) continue;
  for (const sub of (await readdir(path.join(SRC, monster))).sort()) {
    if (SKIP.has(sub)) continue;
    const dir = path.join(SRC, monster, sub);
    if (!(await stat(dir)).isDirectory()) continue;
    const files = await readdir(dir);
    const pick = (ext) => files.find((f) => f.endsWith(ext));
    const [json, atlas, png] = [pick(".json"), pick(".atlas"), pick(".png")];
    if (!json || !atlas || !png) throw new Error(`Thiếu file trong ${dir}`);

    const { id, tier } = parse(sub);
    const base = `spine/${id}/${tier}`;
    const jsonBuf = await readFile(path.join(dir, json));
    const anims = Object.keys(JSON.parse(jsonBuf).animations ?? {});
    // Atlas 1 trang (đã kiểm), dòng đầu là tên texture → trỏ sang file webp mới.
    const atlasTxt = (await readFile(path.join(dir, atlas), "utf8")).replace(
      /^.*\.png$/m,
      `${tier}.webp`,
    );
    const webp = await sharp(path.join(dir, png))
      .webp({ quality: 90, alphaQuality: 100, effort: 6 })
      .toBuffer();

    await put(`${base}.json`, jsonBuf, "application/json");
    await put(`${base}.atlas`, Buffer.from(atlasTxt), "text/plain");
    await put(`${base}.webp`, webp, "image/webp");
    (manifest[id] ??= {})[tier] = anims;
  }
}

const logo = await sharp(path.join(ROOT, "Logo/logo.png"))
  .resize({ width: 1200 })
  .webp({ quality: 90, alphaQuality: 100 })
  .toBuffer();
await put("logo.webp", logo, "image/webp");
const splash = await sharp(path.join(ROOT, "Logo/SplashArt.jpg"))
  .jpeg({ quality: 86, mozjpeg: true })
  .toBuffer();
await put("splash.jpg", splash, "image/jpeg");

console.error(`\n${(bytes / 1e6).toFixed(1)}MB ${APPLY ? "đã upload" : "(dry-run)"} → ${PREFIX}/`);
console.log(JSON.stringify(manifest, null, 2));
