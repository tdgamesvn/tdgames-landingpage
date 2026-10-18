// Splash art (ảnh hero) riêng cho từng hệ Monster Legends — sếp 2026-10-18: "chất lượng
// như splash Liên Minh Huyền Thoại của Riot", nhân vật lấy từ chính bài đăng làm ref.
//
//   node --env-file=.env.local scripts/gen-monster-legends-splash.mjs Fire            # gen
//   node --env-file=.env.local scripts/gen-monster-legends-splash.mjs Fire --upload   # đẩy R2
//
// Ref nhân vật: scripts/.out/monster-legends/ref-<hệ>-<i>.png — render Spine thật (dáng idle,
// nền trong suốt) chụp bằng Playwright từ trang case study. Ghép thành 1 tờ "character
// sheet" có tên để model giữ đúng thiết kế; SplashArt gốc của game làm ref phong cách.
// ponytail: AI có thể vẽ lệch chi tiết thiết kế quái của khách — luôn soát bằng mắt trước
// khi dùng, lệch nhiều thì gen lại.
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import sharp from "sharp";

const BASE = (process.env.AI_BASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_IMAGE_MODEL || "gpt-image-2";
if (!BASE || !KEY) throw new Error("AI_BASE_URL / AI_API_KEY chưa có trong .env.local");

const [element, ...flags] = process.argv.slice(2);
const OUT = "scripts/.out/monster-legends";
const VERSION = "v2";

// cast: tên theo đúng thứ tự file ref-<hệ>-0..n; hero = con đứng giữa, to nhất.
const SPLASH = {
  Fire: {
    cast: ["Kennix Solaris", "Kaih the Pyrenaut", "Shallinar Emberglow", "Torog Moltenthroat", "Akira Karioka"],
    hero: "Kennix Solaris",
    scene:
      "an erupting volcanic battlefield at dusk — rivers of glowing lava, exploding embers, a towering volcano spewing fire behind, molten-orange and magenta sky",
  },
  Light: {
    cast: ["Jestin Justice", "Maximus Astrum", "Graciel Choirmaster", "Layth Maximus", "Master Shannara"],
    hero: "Jestin Justice",
    scene:
      "a radiant celestial sanctuary above the clouds — white marble and gold temples, floating islands, golden god-rays bursting through the clouds, warm gold and soft blue sky",
  },
  Earth: {
    cast: ["Miss Qylara Watson", "President Canine", "Eternal Basthet", "Ishigaki", "Turtle Murtle"],
    hero: "Miss Qylara Watson",
    scene:
      "a rocky red canyon at sunset — towering mesas, boulders cracking and flying, dust clouds, warm amber and orange sky",
  },
  Magic: {
    cast: ["Xandrite Spellbound", "Baba Basheer", "Mater Geneza", "Octomancer", "Dr. Bloom"],
    hero: "Xandrite Spellbound",
    scene:
      "an arcane observatory under a swirling teal-and-magenta nebula — floating crystals, glowing magic circles and spell sigils, spiral towers, starry night sky",
  },
  Dark: {
    cast: ["Don Obscurione", "Voreth Voidspawn", "Wilfred Razorstorm", "Anwir Paincraver", "Soulblast"],
    hero: "Don Obscurione",
    scene:
      "a haunted shadow realm under a huge pale moon — twisted dead trees, crooked gothic spires, swirling violet mist and glowing purple runes, deep indigo and violet sky",
  },
  Water: {
    cast: ["Hounen Zennomusuko", "Kirk Moonwalker", "Crabsair", "Iceblood", "Crocark"],
    hero: "Kirk Moonwalker",
    scene:
      "a stormy ocean battlefield at twilight — a colossal wave curling overhead, sea spray and floating droplets, sea stacks and frozen shards, deep blue and teal sky lit by a pale moon",
  },
};
const cfg = SPLASH[element];
if (!cfg) throw new Error(`Chưa có cấu hình splash cho hệ "${element}". Có: ${Object.keys(SPLASH)}`);
const file = `${OUT}/${element.toLowerCase()}-splash-${VERSION}.png`;

/** Cắt sát nhân vật theo kênh alpha (bỏ pixel gần như trong suốt). */
async function trim(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 90) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
  return sharp(path).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer();
}

async function characterSheet() {
  const files = (await readdir(OUT)).filter((f) => f.startsWith(`ref-${element.toLowerCase()}-`)).sort();
  if (files.length !== cfg.cast.length) throw new Error(`Cần ${cfg.cast.length} ref, có ${files.length}`);
  const cellW = 300, cellH = 380, W = cellW * files.length;
  const tiles = [];
  for (const [i, f] of files.entries()) {
    const img = await sharp(await trim(`${OUT}/${f}`)).resize(cellW - 20, cellH - 60, { fit: "inside" }).toBuffer();
    const meta = await sharp(img).metadata();
    tiles.push({ input: img, left: i * cellW + Math.round((cellW - meta.width) / 2), top: 10 + (cellH - 60 - meta.height) });
    const label = Buffer.from(
      `<svg width="${cellW}" height="40"><text x="50%" y="28" font-family="Arial" font-size="22" font-weight="bold" fill="#111" text-anchor="middle">${cfg.cast[i]}</text></svg>`,
    );
    tiles.push({ input: label, left: i * cellW, top: cellH - 45 });
  }
  return sharp({ create: { width: W, height: cellH, channels: 3, background: "#d9d9d9" } })
    .composite(tiles)
    .png()
    .toBuffer();
}

// v2 (sếp 2026-10-18): v1 "real và chi tiết quá" → bám đúng nét SplashArt gốc của game:
// cartoon sạch, khối lớn, ít chi tiết vụn. Giữ bố cục động kiểu splash, bỏ render kỹ.
const PROMPT = () =>
  `Create a key-art splash illustration drawn in EXACTLY the same art style as the second reference image (the official Monster Legends splash art): a clean stylised CARTOON look — big simple readable shapes, bold silhouettes, smooth soft cel-like shading with only 2–3 tones per surface, clean edges, bright saturated colours, minimal texture and minimal fine detail. It must NOT look realistic or highly rendered: no gritty texture, no photographic water or fire, no dense particle noise, no heavy detail, no hyper-real lighting. ` +
  `Composition like a game splash: dynamic, with clear foreground and background depth and a heroic camera angle, but uncluttered and easy to read — generous simple background shapes like the reference. ` +
  `Feature EXACTLY these ${cfg.cast.length} monsters from the first reference (a character sheet with their names), and keep every design faithful — same body shape, colours, armour, horns, weapons and accessories: ${cfg.cast.join(", ")}. ` +
  `${cfg.hero} is the hero: largest, centred in the foreground in a powerful action pose; the others are arranged around and behind in dynamic poses at varied depths, all clearly readable. ` +
  `Setting: ${cfg.scene}, painted with the same simple cartoon shapes as the reference. Wide landscape composition, full-bleed. No text, no logo, no watermark, no UI, no frame.`;

/**
 * POST multipart không giới hạn chờ header. ponytail: fetch của Node (undici) cắt ở 300s
 * chờ header — splash Fire nhiều ref, server ảnh trả sau >300s nên fetch luôn timeout.
 */
async function postForm(url, form) {
  const req = new Request(url, { method: "POST", body: form });
  const body = Buffer.from(await req.arrayBuffer());
  return new Promise((resolve, reject) => {
    const r = (url.startsWith("https:") ? https : http).request(
      url,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${KEY}`,
          "content-type": req.headers.get("content-type"),
          "content-length": body.length,
        },
        timeout: 15 * 60_000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString() }));
      },
    );
    r.on("timeout", () => r.destroy(new Error("timeout 15 phút")));
    r.on("error", reject);
    r.end(body);
  });
}

async function gen() {
  const sheet = await characterSheet();
  await mkdir(OUT, { recursive: true });
  await writeFile(`${OUT}/${element.toLowerCase()}-sheet.png`, sheet);
  const style = await sharp("media-inbox/Monster Legend/Logo/SplashArt.jpg").resize(1536, 864).png().toBuffer();
  const form = new FormData();
  form.set("model", MODEL);
  form.set("size", "1536x1024");
  form.set("prompt", PROMPT());
  form.append("image[]", new Blob([sheet], { type: "image/png" }), "sheet.png");
  form.append("image[]", new Blob([style], { type: "image/png" }), "style.png");
  const { status, text } = await postForm(`${BASE}/images/edits`, form);
  if (status !== 200) throw new Error(`${status} ${text.slice(0, 300)}`);
  const b64 = JSON.parse(text)?.data?.[0]?.b64_json;
  if (typeof b64 !== "string") throw new Error("không có b64_json");
  const buf = Buffer.from(b64, "base64");
  await writeFile(file, buf);
  const m = await sharp(buf).metadata();
  console.log(`✓ ${file} ${m.width}×${m.height}`);
}

if (!flags.includes("--upload")) await gen();
else {
  const jpg = await sharp(await readFile(file)).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  const Key = `landing/portfolio/monster-legends-${element.toLowerCase()}/splash-ai-${VERSION}.jpg`;
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
      Body: jpg,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=86400",
    }),
  );
  console.log(`↑ ${Key} ${(jpg.length / 1e6).toFixed(2)}MB`);
}
