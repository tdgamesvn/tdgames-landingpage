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
const MODEL = process.env.AI_IMAGE_MODEL || "gpt-image-2.5-sunburst";
if (!BASE || !KEY) throw new Error("AI_BASE_URL / AI_API_KEY chưa có trong .env.local");

const [element, ...flags] = process.argv.slice(2);
const OUT = "scripts/.out/monster-legends";
const VERSION = "v5";

// cast: tên theo đúng thứ tự file ref-<hệ>-0..n; hero = con đứng giữa, to nhất.
const SPLASH = {
  // Trang tổng /portfolio/monster-legends — 6 con tiêu biểu của 6 hệ (ref-all-* copy từ ref các hệ).
  All: {
    cast: ["Kennix Solaris", "Kirk Moonwalker", "Don Obscurione", "Jestin Justice", "Tyr Stormbringer", "Xandrite Spellbound"],
    hero: "Kennix Solaris",
    shot: "Grand alliance poster: six champions of different elements stand together on a high cliff in a loose arc facing the viewer, each wrapped in its own element (fire, water, shadow, holy light, lightning, arcane), their energies swirling and meeting in the sky above them; slightly low heroic camera.",
    scene:
      "a legendary monster world at sunset — floating islands, distant volcano, ocean, gothic spires and crystal towers blending into one epic landscape, colourful dramatic sky",
  },
  Fire: {
    // Bố cục riêng từng hệ (sếp 2026-10-19: các banner na ná pose như nhau).
    shot: "Side-on charge from left to right: the whole squad sprints across a lava field in one diagonal line, Kennix Solaris leading at front-right with wings flared and trident thrust forward, the others strung out behind him; low tracking camera, motion streaks.",
    cast: ["Kennix Solaris", "Kaih the Pyrenaut", "Shallinar Emberglow", "Torog Moltenthroat", "Akira Karioka"],
    hero: "Kennix Solaris",
    // v3 sai giải phẫu Kennix + Kaih (sếp 2026-10-19) → mô tả đúng thiết kế, giữ tỉ lệ in-game.
    notes:
      "Keep each monster's in-game body proportions and anatomy exactly as on the sheet — dynamic poses but no stretched or invented limbs. " +
      "Kennix Solaris is a muscular phoenix-man: golden bird-head helmet with a beak, red muscular torso with a gold sun emblem on the chest, gold shoulder and hip armour, two big flame wings from the back, a fan of flame tail feathers from the hips, clawed hands, two short legs ending in red three-toed bird talons, holding one golden flame trident. " +
      "Kaih the Pyrenaut is a short stocky chibi-proportioned knight: glowing molten-lava body showing through cracked black spiked armour, black horned helmet with a burning flame mane behind the head, red tattered cape, big round lava fists, short thick legs in black boots, wielding one huge broken black obsidian sword with glowing lava cracks.",
    scene:
      "an erupting volcanic battlefield at dusk — rivers of glowing lava, exploding embers, a towering volcano spewing fire behind, molten-orange and magenta sky",
  },
  Metal: {
    // Bố cục riêng từng hệ (sếp 2026-10-19: các banner na ná pose như nhau).
    shot: "Symmetrical standoff seen from a high three-quarter angle: Exarch Quor stands calm and tall in the middle of a steel platform raising both hands as glowing machines power up, the robots flank him in a V formation facing the viewer.",
    cast: ["Exarch Quor", "Primerion Unimate", "Droitler", "Ion V2", "Mollugh"],
    hero: "Exarch Quor",
    scene:
      "a futuristic steel foundry city at dusk — giant gears, pipes and glowing furnaces, sparks flying, cyan energy beams, steel-blue and orange sky",
  },
  Nature: {
    // Bố cục riêng từng hệ (sếp 2026-10-19: các banner na ná pose như nhau).
    shot: "Ambush from the canopy: Florian Malsang crashes down from above in a big leap toward the camera, the others burst out of the foliage from both sides and from behind giant leaves; dramatic top-down-ish angle.",
    cast: ["Florian Malsang", "Goblarzd", "Gonzo", "Onikapa", "Wootr"],
    hero: "Florian Malsang",
    scene:
      "an ancient enchanted jungle — giant twisted trees, vines and huge leaves, glowing spores and falling petals, soft green-gold light shafts",
  },
  Thunder: {
    // Bố cục riêng từng hệ (sếp 2026-10-19: các banner na ná pose như nhau).
    shot: "Heroic low worm's-eye shot: Tyr Stormbringer stands on a peak raising his axe to the sky as a lightning bolt strikes it, the others pose on lower rocks at the left and right edges looking up, storm swirling overhead.",
    cast: ["Tyr Stormbringer", "V-Kid", "Godfather Imigbo", "Lightning Star", "Proud Lionell"],
    hero: "Tyr Stormbringer",
    scene:
      "a stormy mountain summit at night — jagged peaks, swirling storm clouds, huge forks of lightning, crackling electric energy, navy and teal sky",
  },
  Special: {
    // Bố cục riêng từng hệ (sếp 2026-10-19: các banner na ná pose như nhau).
    shot: "Playful group photo-op: the three monsters pose together like a party poster — Nebotus Evil Lord looming behind with wings spread wide, Cakelius and Idolator in front striking cheeky poses, confetti and fireworks around them.",
    cast: ["Nebotus Evil Lord", "Cakelius the Tenth", "Idolator"],
    hero: "Nebotus Evil Lord",
    scene:
      "a whimsical floating carnival island at twilight — candy-coloured spires, hot-air balloons, fireworks and confetti, violet and peach sky",
  },
  Light: {
    // Bố cục riêng từng hệ (sếp 2026-10-19: các banner na ná pose như nhau).
    shot: "Celestial descent: Jestin Justice floats down from the sky through a beam of light with arms open, the others kneel and rise on marble steps below him on both sides; vertical-ish heroic upward framing kept inside the wide image.",
    cast: ["Jestin Justice", "Maximus Astrum", "Graciel Choirmaster", "Layth Maximus", "Master Shannara"],
    hero: "Jestin Justice",
    // v4 vẽ Layth thành 2 đầu sư tử (sếp 2026-10-19) → nói rõ thiết kế.
    notes:
      "Layth Maximus is ONE single lion king with ONE head (gold laurel crown, red cape, white-gold armour, golden sceptre) seated on a red-and-gold throne that walks on clawed legs — never two lions, never two heads.",
    scene:
      "a radiant celestial sanctuary above the clouds — white marble and gold temples, floating islands, golden god-rays bursting through the clouds, warm gold and soft blue sky",
  },
  Earth: {
    // Bố cục riêng từng hệ (sếp 2026-10-19: các banner na ná pose như nhau).
    shot: "Head-on stampede toward the camera: all five charge straight at the viewer through a canyon, kicking up rocks and dust, Miss Qylara Watson front and centre with her shield, others close behind in a tight wedge.",
    cast: ["Miss Qylara Watson", "President Canine", "Eternal Basthet", "Ishigaki", "Turtle Murtle"],
    hero: "Miss Qylara Watson",
    scene:
      "a rocky red canyon at sunset — towering mesas, boulders cracking and flying, dust clouds, warm amber and orange sky",
  },
  Magic: {
    // Bố cục riêng từng hệ (sếp 2026-10-19: các banner na ná pose như nhau).
    shot: "Duel of spells: the monsters stand in a circle around a giant glowing magic sigil on the floor, casting spells into its centre where Xandrite Spellbound hovers; slightly overhead camera looking down on the circle.",
    cast: ["Xandrite Spellbound", "Baba Basheer", "Mater Geneza", "Octomancer", "Dr. Bloom"],
    hero: "Xandrite Spellbound",
    scene:
      "an arcane observatory under a swirling teal-and-magenta nebula — floating crystals, glowing magic circles and spell sigils, spiral towers, starry night sky",
  },
  Dark: {
    // Bố cục riêng từng hệ (sếp 2026-10-19: các banner na ná pose như nhau).
    shot: "Ominous silhouette shot: Don Obscurione stands in the foreground seen from behind and to the side, turning his head toward the viewer, cape billowing, facing his allies who emerge from violet mist below a huge full moon.",
    cast: ["Don Obscurione", "Voreth Voidspawn", "Wilfred Razorstorm", "Anwir Paincraver", "Soulblast"],
    hero: "Don Obscurione",
    scene:
      "a haunted shadow realm under a huge pale moon — twisted dead trees, crooked gothic spires, swirling violet mist and glowing purple runes, deep indigo and violet sky",
  },
  Water: {
    // Bố cục riêng từng hệ (sếp 2026-10-19: các banner na ná pose như nhau).
    shot: "Surfing a giant wave: the squad rides and leaps off a huge curling wave from right to left, Kirk Moonwalker standing on the crest pointing his trident, others splashing out of the water around him; dynamic tilted camera.",
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
  // Bỏ cột/hàng chỉ có vài pixel (đốm sparkle lẻ) — trước đây làm khung rộng, nhân vật bị thu
  // nhỏ trong sheet → AI vẽ sai (Layth 2 đầu, sếp 2026-10-19).
  const cols = new Array(info.width).fill(0), rows = new Array(info.height).fill(0);
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 90) { cols[x]++; rows[y]++; }
  const minC = info.height * 0.02, minR = info.width * 0.02;
  const x0 = cols.findIndex((n) => n > minC), x1 = cols.findLastIndex((n) => n > minC);
  const y0 = rows.findIndex((n) => n > minR), y1 = rows.findLastIndex((n) => n > minR);
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
  `Composition for THIS image (follow it closely, it must differ from a generic line-up): ${cfg.shot} ${cfg.hero} is the clear focal hero. ${cfg.notes ?? ""} ` +
  // Hero trang cắt ~25% trên/dưới trên desktop (khung ≈2.2:1) → mọi nhân vật nằm dải giữa.
  `SAFE ZONE: every monster must be fully inside the central band between 15% and 85% of the image height and between 8% and 92% of the width — no character cut by any edge, keep sky and ground as margins. ` +
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
