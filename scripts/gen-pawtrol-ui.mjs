// Gen toàn bộ asset cho case study UI/UX "Pawtrol Tactics" (game concept tự nghĩ, 100% AI).
// Bước 1: key art (generations) làm neo style. Bước 2: mọi màn khác gen qua /images/edits
// với key art làm ảnh tham chiếu → đồng bộ nhân vật/màu.
//   node --env-file=.env.local scripts/gen-pawtrol-ui.mjs [id ...]   # gen (bỏ qua file đã có)
//   node --env-file=.env.local scripts/gen-pawtrol-ui.mjs --preview   # ghép board 3 màn ra .out để soát
//   node --env-file=.env.local scripts/gen-pawtrol-ui.mjs --upload    # đẩy .out (+ board) lên R2
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const BASE = (process.env.AI_BASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_IMAGE_MODEL || "gpt-image-2.5";
const OUT = "scripts/.out/pawtrol";
const R2_PREFIX = "landing/portfolio/pawtrol-tactics";

const STYLE =
  "Polished 2D cartoon mobile game art, thick dark-brown outlines, chunky rounded 'squishy' UI with soft bevels and drop shadows, candy palette: warm orange #FF8A3D, teal #2EC4B6, cream #FFF4DC, berry pink #FF5D8F, deep navy #2B2D42 for text panels. Bold rounded display font. Crisp, clean, professional shipped-game quality UI, legible short English labels only, no lorem ipsum, no watermark.";
const CAST =
  "Cast: Sir Whiskers (orange tabby cat knight, silver helmet, small sword and round shield), Biscuit (corgi wizard with star-tipped wand, purple hat), Bao (chubby panda healer with leaf-green scarf and bamboo staff), Fennel (green frog archer with red hood). Enemies: Candy Gremlins (mischievous purple imps made of jelly and lollipops).";
const PHONE =
  "A single portrait mobile game screen, full-bleed 9:19.5 phone UI screenshot, no device frame, no hands, safe-area top bar.";

/** [id, size, prompt] — id đầu tiên là key art. */
const JOBS = [
  ["key-art", "1536x1024", `Key art banner for the mobile turn-based tactics game 'PAWTROL TACTICS': the four heroes leaping heroically toward the viewer on a sunny floating island village (Biscuit Isle) with cookie-shaped rooftops, Candy Gremlins in the background. Big glossy game logo 'PAWTROL TACTICS' with a paw-print badge at the upper left. ${CAST} ${STYLE}`],
  ["art-direction", "1536x1024", `Art direction presentation board for the game 'Pawtrol Tactics', clean design-document layout on a cream background: left side full-body turnaround lineup of the four heroes with name tags; right side a colour palette row of swatches labelled with hex codes, a typography sample 'Aa Pawtrol Display', and a small moodboard of UI shapes (rounded buttons, paw icons, candy gems). Title 'ART DIRECTION' at top. ${CAST} ${STYLE}`],
  ["user-flow", "1536x1024", `UX user-flow diagram board for a mobile game, on a soft navy grid background: eight small portrait phone-screen thumbnails (Splash, Lobby, World Map, Team Setup, Battle, Victory, Summon, Shop) connected by clean rounded arrows showing the core loop, with short labels under each. Title 'CORE LOOP & USER FLOW'. Looks like a professional Figma flow export. ${STYLE}`],
  ["splash", "1024x1536", `${PHONE} Splash/loading screen: big 'PAWTROL TACTICS' logo in the upper third, the four heroes posed together in the middle, a rounded orange loading bar at the bottom reading 'Loading... 72%', a small tip text 'Tip: Bao heals the lowest HP ally'. ${CAST} ${STYLE}`],
  ["lobby", "1024x1536", `${PHONE} Main lobby screen: top bar with player avatar, level 24, coin and gem counters with plus buttons; Sir Whiskers standing large in the centre on a village plaza; left side vertical icon buttons (Mail, Events, Quests); right side (Shop, Summon); huge orange 'BATTLE' button at the bottom centre above a 5-tab bottom navigation bar (Heroes, Team, Home, Guild, Shop) with Home highlighted. ${CAST} ${STYLE}`],
  ["world-map", "1024x1536", `${PHONE} World map / stage select screen: a winding path across a cartoon island map with numbered round stage nodes (1-1 to 1-8), completed nodes show 3 gold stars, current node 1-6 glowing with a hero head marker, a locked boss node with a Candy Gremlin king icon; top bar with chapter title 'Chapter 1: Biscuit Isle' and energy counter; bottom popup card 'Stage 1-6 — Recommended Power 3,200' with a teal 'GO' button. ${STYLE}`],
  ["hero-roster", "1024x1536", `${PHONE} Hero collection screen: title 'HEROES', filter tabs (All, Tank, Mage, Healer, Ranged), a 3-column grid of hero cards with rarity frames (gold, purple, blue), each card showing the hero portrait, star rating and level; some cards greyed out as locked silhouettes; bottom navigation bar with Heroes highlighted. ${CAST} ${STYLE}`],
  ["hero-detail", "1024x1536", `${PHONE} Hero detail screen for Biscuit the corgi wizard: large character art in the upper half on a purple magic backdrop, name plate 'BISCUIT — Star Wizard', 5-star rarity; stats panel (HP, ATK, DEF, SPD with numbers and bars); three skill icons with short names (Star Bolt, Comet Rain, Mana Shield); equipment slots row; big orange 'LEVEL UP' button with coin cost. ${CAST} ${STYLE}`],
  ["team-setup", "1024x1536", `${PHONE} Team formation screen: title 'TEAM SETUP', a 3-slot battle formation (front, middle, back) on a grassy board with Sir Whiskers front, Bao middle, Fennel back; total team power '4,860' badge; element synergy chip 'Paw Bond +10% ATK'; a scrollable hero bench of small portraits at the bottom; teal 'START BATTLE' button. ${CAST} ${STYLE}`],
  ["battle-turn", "1024x1536", `${PHONE} Turn-based battle screen, player's turn: heroes on the lower half facing three Candy Gremlins on the upper half on a candy forest battlefield; HP bars above every unit; turn order timeline of small portraits along the top; it is Sir Whiskers' turn — his portrait is highlighted; bottom action panel with four big round skill buttons (Attack, Shield Bash, Taunt, Ultimate with a charging ring at 80%), a target reticle on one Gremlin, damage preview '-320'. ${CAST} ${STYLE}`],
  ["battle-ultimate", "1024x1536", `${PHONE} Battle ultimate cut-in moment: a dramatic diagonal banner cut-in of Biscuit the corgi wizard casting 'COMET RAIN', speed lines, stars and comets crashing down on the Candy Gremlins, big bouncy damage numbers '-1,280 CRIT!', screen-shake impact flashes, battle UI dimmed underneath. ${CAST} ${STYLE}`],
  ["victory", "1024x1536", `${PHONE} Victory results screen: big ribbon banner 'VICTORY!' with three gold stars popping in, the four heroes celebrating, EXP bars filling for each hero, a rewards row of item cards (coins 1,200, gems 30, a treat-shaped upgrade item), buttons 'NEXT STAGE' (orange) and 'HOME' (teal). Confetti. ${CAST} ${STYLE}`],
  ["summon", "1024x1536", `${PHONE} Gacha summon screen: a giant glowing magic pet-carrier/portal in the centre bursting with golden light, banner title 'STARFALL SUMMON — Rate Up: Biscuit', featured hero art at the side, pity counter '42/80', two buttons at the bottom 'Summon x1 (160 gems)' and 'Summon x10 (1,600 gems)', small 'Rates' info link. ${CAST} ${STYLE}`],
  ["shop", "1024x1536", `${PHONE} In-game shop screen: title 'SHOP', tabs (Deals, Gems, Coins, Chests); a large featured 'Starter Pack' card with Bao the panda, '-80%' sticker and price '$0.99'; below a 2-column grid of gem bundles and treasure chests with prices; daily free reward card with a 'FREE' green button; timer '23:59:12'. ${CAST} ${STYLE}`],
  ["quests", "1024x1536", `${PHONE} Daily quests & event screen: title 'DAILY QUESTS', activity progress bar with chest milestones at 20/40/60/80/100, list of quest rows with icons, progress text (e.g. 'Win 3 battles 2/3', 'Summon once 1/1') and 'CLAIM' or 'GO' buttons; a top event banner 'Candy Carnival — 3 days left'. ${STYLE}`],
  ["ui-kit", "1536x1024", `UI kit / design system sheet for the mobile game 'Pawtrol Tactics' on a cream background, organised in neat labelled sections: BUTTONS (primary orange, secondary teal, disabled grey, pressed state), ICONS (coin, gem, energy, mail, settings, quest, shop, paw), FRAMES (rarity card frames blue/purple/gold), BARS (HP, EXP, progress), POPUP (a sample modal 'Not enough gems' with buttons), TYPOGRAPHY scale (H1, H2, Body). Professional Figma component sheet presentation. ${STYLE}`],
  ["showcase", "1536x1024", `Professional portfolio presentation mockup: three modern smartphones floating at slight angles on a gradient orange-to-teal background with soft shadows, screens showing the Pawtrol Tactics lobby, a turn-based battle, and a victory screen; small 'PAWTROL TACTICS — UI/UX' wordmark in a corner. ${CAST} ${STYLE}`],
];

async function callImage(prompt, size, refPng) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      let res;
      if (refPng) {
        const form = new FormData();
        form.set("model", MODEL);
        form.set("size", size);
        form.set("prompt", `Use the reference image only as the style and character guide (same characters, palette, outline and UI style). ${prompt}`);
        form.set("image", new Blob([refPng], { type: "image/png" }), "ref.png");
        res = await fetch(`${BASE}/images/edits`, { method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form });
      } else {
        res = await fetch(`${BASE}/images/generations`, {
          method: "POST",
          headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: MODEL, prompt, size, n: 1 }),
        });
      }
      const json = await res.json().catch(() => null);
      const b64 = json?.data?.[0]?.b64_json;
      if (res.ok && typeof b64 === "string") return Buffer.from(b64, "base64");
      console.error(`  attempt ${attempt}: HTTP ${res.status} ${JSON.stringify(json)?.slice(0, 200)}`);
    } catch (e) {
      console.error(`  attempt ${attempt}: ${e.message}`);
    }
  }
  return null;
}

async function gen(only) {
  await fs.mkdir(OUT, { recursive: true });
  const exists = async (f) => fs.access(f).then(() => true, () => false);
  const keyPath = path.join(OUT, "key-art.png");
  const todo = JOBS.filter(([id]) => (only.length ? only.includes(id) : true));
  // Chỉ gen lại key-art khi gọi đích danh hoặc chưa có — nó là neo style của mọi màn khác.
  if (only.includes("key-art") || !(await exists(keyPath))) {
    const [, size, prompt] = JOBS[0];
    console.log("→ key-art");
    const buf = await callImage(prompt, size, null);
    if (!buf) throw new Error("key-art failed");
    await fs.writeFile(keyPath, await sharp(buf).png().toBuffer());
  }
  const ref = await sharp(await fs.readFile(keyPath)).resize(1024, null).png().toBuffer();
  const rest = todo.filter(([id]) => id !== "key-art");
  const queue = [...rest];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const [id, size, prompt] = queue.shift();
        const file = path.join(OUT, `${id}.png`);
        if (!only.length && (await exists(file))) continue;
        console.log(`→ ${id}`);
        const buf = await callImage(prompt, size, ref);
        if (!buf) { console.error(`✗ ${id}`); continue; }
        // Proxy không giữ đúng `size` (key-art ra 1774×887) → KHÔNG crop về size, cắt mất
        // top bar / bottom nav. Giữ nguyên tỉ lệ, chỉ log để soát màn nào ra sai hướng.
        const { width, height } = await sharp(buf).metadata();
        await fs.writeFile(file, await sharp(buf).png().toBuffer());
        console.log(`✓ ${id} ${width}x${height} (yêu cầu ${size})`);
      }
    }),
  );
}

/** Màn dọc ghép 3-up thành 1 board ngang: trio của CaseStudyLayout cao tối đa 460px nên
 *  màn điện thoại (~0.46) chỉ còn ~210px ngang, không đọc được UI. Board dùng variant "full". */
const BOARDS = {
  "screens-core": ["splash", "lobby", "world-map"],
  "screens-heroes": ["hero-roster", "hero-detail", "team-setup"],
  "screens-battle": ["battle-turn", "battle-ultimate", "victory"],
  "screens-meta": ["summon", "shop", "quests"],
};

async function board(ids) {
  const H = 1600, GAP = 64, PAD = 96, R = 56;
  const shots = await Promise.all(
    ids.map(async (id) => {
      const img = sharp(await fs.readFile(path.join(OUT, `${id}.png`))).resize({ height: H });
      const { info, data } = await img.png().toBuffer({ resolveWithObject: true });
      const mask = Buffer.from(`<svg width="${info.width}" height="${H}"><rect width="100%" height="100%" rx="${R}"/></svg>`);
      return { w: info.width, buf: await sharp(data).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer() };
    }),
  );
  const width = PAD * 2 + shots.reduce((s, x) => s + x.w, 0) + GAP * (shots.length - 1);
  const layers = [];
  let left = PAD;
  for (const { w, buf } of shots) {
    layers.push({ input: buf, top: PAD, left });
    left += w + GAP;
  }
  return sharp({ create: { width, height: H + PAD * 2, channels: 3, background: "#1c1e2e" } }).composite(layers);
}

async function upload() {
  const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
  const put = async (id, img) => {
    const body = await img.jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    const Key = `${R2_PREFIX}/${id}.jpg`;
    await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key, Body: body, ContentType: "image/jpeg", CacheControl: "public, max-age=31536000, immutable" }));
    console.log(`↑ ${Key} (${Math.round(body.length / 1024)}KB)`);
  };
  for (const [id] of JOBS) await put(id, sharp(await fs.readFile(path.join(OUT, `${id}.png`))));
  for (const [id, ids] of Object.entries(BOARDS)) await put(id, await board(ids));
}

const args = process.argv.slice(2);
if (!BASE || !KEY) throw new Error("AI_BASE_URL / AI_API_KEY missing");
if (args.includes("--preview")) {
  for (const [id, ids] of Object.entries(BOARDS)) await (await board(ids)).jpeg().toFile(path.join(OUT, `${id}.jpg`));
} else if (args.includes("--upload")) await upload();
else await gen(args);
