// Sinh ảnh cover cho 2 mục của /services/full-game-production bằng đúng luồng
// ảnh AI của blog (POST /api/admin/generate-image → gpt-image → R2 → media_assets).
//
// Usage (cần `npm run dev` đang chạy):
//   node --env-file=.env.local scripts/gen-service-images.mjs            # tất cả
//   node --env-file=.env.local scripts/gen-service-images.mjs card       # chỉ // 01
//   node --env-file=.env.local scripts/gen-service-images.mjs step       # chỉ // 02
//
// In ra `id → url`; dán URL vào DEFAULT_CARDS (page.tsx) và
// serviceFullGameProductionWorkflowConfig (service-workflow-presets.ts).

// ponytail: [::1] chứ không phải 127.0.0.1 — next dev bind IPv6, còn IPv4:3000 trên
// máy này đang bị vite của tdgames-platforms chiếm (POST rơi vào đó → 404 rỗng).
const APP = process.env.APP_URL ?? "http://[::1]:3000";
const KEY = process.env.ADMIN_SECRET;
const only = process.argv.slice(2); // rỗng = tất cả; nhiều prefix cũng được

// Gu chung, sếp chốt lần 3: ref = key art **Squad Busters / Supercell**. Đồng bộ nằm ở
// NGÔN NGỮ TẠO HÌNH (toon 3D render, outline dày, rim light, nền gradient rực, nhân vật
// lao vào camera) — KHÔNG phải ở bối cảnh hay nhân vật.
// ponytail: bản trước khoá cứng 1 bối cảnh + 1 CAST → 11 ảnh na ná nhau. Nay bỏ CAST,
// mỗi shot tự có nhân vật riêng, palette riêng, góc máy riêng (ghi thẳng trong subject).
const STYLE =
  "Supercell-style mobile game key art (Squad Busters / Brawl Stars look): stylised 3D-rendered cartoon characters with thick dark outlines, chunky exaggerated proportions, oversized heads hands and feet, huge over-the-top facial expressions mid-shout, glossy toon shading with strong rim light and crisp cast shadows, punchy high-contrast saturated colours over a vivid glowing gradient sky, dynamic action composition with the subject charging toward the camera in wide-angle foreshortening, motion dust puffs and chunky impact shapes, clean depth-blurred background, bold arcade poster energy";
const HANDMADE =
  "polished stylised 3D toon render, off-centre asymmetric composition, one clear hero subject filling the frame. Must NOT be: photo-real, muted or desaturated, dark or near-black, gritty, or cluttered with tiny background props. Avoid the generic AI look: no lens flares, no ring of small icons orbiting the subject, no perfectly symmetrical layout, no chrome or glass gradients";

// ROSTER — sếp muốn có câu chuyện: 6 bộ phận = 6 nhân vật core, thiết kế khoá cứng và
// lặp lại y hệt ở mọi ảnh có mặt. 6 card = chân dung hành động từng người; 5 step = họ
// chuyền việc cho nhau theo quy trình.
// ponytail: mô tả phải chi tiết đến mức generator không có chỗ bịa (tóc, mũ, màu áo,
// dáng người) — bản trước chỉ ghi "a cartoon hero" nên mỗi ảnh ra một người khác.
const CHARS = {
  maya: "MAYA the game designer, a young woman with black curly hair pulled into a high puff, round tortoiseshell glasses, a brown flat cap, a mustard-yellow shirt with rolled sleeves and a pencil behind her ear",
  rio: "RIO the art director, a young woman with short hot-pink hair, a white beret spattered with paint, white dungarees covered in colourful paint smears and a red neckerchief",
  kenji: "KENJI the animator, a lanky young man with spiky blond hair and a blue headband, a cobalt-blue hoodie with rolled sleeves, baggy shorts and chunky orange sneakers",
  vee: "VEE the VFX artist, a girl with dark brown skin and purple hair in two buns, orange flight goggles pushed up on her forehead, an orange flight suit and big glowing cyan gloves",
  bruno: "BRUNO the developer, a stocky bearded man with a red beard, a green hard hat, a grey engineer's jumpsuit with a tool belt and heavy brown boots",
  pip: "PIP the QA tester, a small wiry girl with platinum-white hair in a ponytail, a yellow hard hat, a bright orange hi-vis vest over a teal tee and a clipboard on her hip",
};
const cast = (...keys) => keys.map((k) => CHARS[k]).join("; ");

// ponytail: mỗi subject tự chỉ định palette + góc máy — đó là thứ tạo khác biệt nội dung,
// còn STYLE lo phần đồng bộ. Đừng gom chúng về một bối cảnh chung lần nữa.
// ponytail: hero là ngoại lệ DUY NHẤT được phép tối — chữ trắng nằm đè lên ảnh nên
// 40% bên trái phải trống và tối, không nhân vật, không đạo cụ. Ảnh cũ (summonerDetail)
// hỏng đúng chỗ này: con sư tử nằm ngay dưới tiêu đề.
const HERO_TAIL =
  "polished stylised 3D toon render. The artwork must be full-bleed and fill the entire image edge to edge — absolutely no black letterbox bars at the top or bottom, no cinematic framing borders, no inner frame. The LEFT 40% of the frame must stay an empty simple dark gradient — no characters, no props, no busy detail there — so white headline text can sit on it and stay readable. Keep every important element vertically centred with generous empty sky above and ground below, because the banner gets cropped top and bottom. Must NOT be photo-real, gritty or desaturated. Avoid the generic AI look: no lens flares, no ring of small icons, no perfectly symmetrical layout";

const SHOTS = [
  // ---- hero banner của trang (slot `hero`) ----
  ["hero-full-game-production", `Wide full-bleed hero banner artwork for a game studio. The full squad charges toward the camera as one group, tightly framed in the RIGHT half of the image, MAYA leading at the front with the others fanned out behind her, dust clouds and speed lines trailing: ${cast("maya", "rio", "kenji", "vee", "bruno", "pip")}. The LEFT half is empty deep indigo and violet night sky with soft clouds, drifting embers and warm amber light rays only. Strong warm amber and orange rim light on the squad from the right, dramatic contrast against the dark left side, epic triumphant mood`, HERO_TAIL],

  // ---- 4 card dịch vụ ở section "Services" trang chủ (slot home/service-card,
  //      fallback là services.cards[].image trong site.json). Card gần vuông nên
  //      gen 1024x1024, chủ thể canh giữa. ponytail: đừng gen 1536x1024 rồi để
  //      object-cover xén mất hai bên như 11 ảnh kia.
  ["svc-animation", `${cast("kenji")}. He stands centred spinning a glowing curved animation timeline around himself like a hoop, four key poses of a chunky cartoon monster running frozen along the arc, one of them showing the bone rig underneath, motion arcs and onion-skin ghosts, turquoise and lime gradient background`, HANDMADE, "1024x1024"],
  ["svc-art", `${cast("rio")}. She stands centred in front of a huge canvas and a freshly painted chunky cartoon hero is climbing out of it into the real world, thick paint dripping off the frame, colour swatch cards fanning through the air, magenta and orange gradient background`, HANDMADE, "1024x1024"],
  ["svc-vfx", `${cast("vee")}. She stands centred and slams both glowing gloves together, a spiral of fire, lightning arcs and slash trails whirling around her body, sparks and shockwave rings, violet and hot orange gradient background`, HANDMADE, "1024x1024"],
  // ponytail: prompt liệt kê đủ 6 nhân vật làm image API timeout — rút còn 4 người
  // và mô tả ngắn. Muốn đủ đội hình thì xem step-3 (khung ngang, thoáng hơn).
  ["svc-full-game", `A victorious team of four cartoon devs cheering around a giant smartphone standing upright behind them running a colourful puzzle game: ${cast("maya", "rio", "vee", "bruno")}, warm amber and violet gradient background`, HANDMADE, "1024x1024"],

  // ---- // 01 What we do (6 card, khớp DEFAULT_CARDS trong page.tsx) ----
  ["card-1-game-design", `${cast("maya")}. She slams a huge glowing blueprint board down toward the camera, chunky level blocks, arrow tokens and dice erupting off it around her, grinning with wild confidence, low heroic camera angle, deep blue and violet gradient sky with cyan glow`],
  ["card-2-art-direction", `${cast("rio")}. She swings an oversized paintbrush like a sword, a thick arc of magenta and orange paint splashing across the frame and repainting a grey statue behind her into full colour, side three-quarter camera, hot pink and tangerine gradient background`],
  ["card-3-animation", `${cast("kenji")}. He sprints straight at the camera, three translucent afterimage copies of himself trailing behind, the furthest copy drawn as a glowing skeleton rig with visible bones and joints, motion streaks, lime green and turquoise gradient background`],
  ["card-4-vfx", `${cast("vee")}. She bursts out of a giant orange and yellow explosion shockwave toward the camera, both glowing gloves throwing sparks, thick stylised smoke curls, slash arcs and lightning shapes around her, fiery red-orange gradient sky`],
  ["card-5-development", `${cast("bruno")}. He rides on the shoulder of a huge friendly robot built from a giant smartphone, swinging a wrench, chunky gears and glowing cables plugged into its chest, welding sparks, low angle looking up, electric blue and yellow gradient background`],
  ["card-6-qa-launch", `${cast("pip")}. She stands triumphantly with one boot on a squashed giant googly-eyed bug monster, a big green checkmark badge raised overhead, confetti bursting, three glowing phones behind her, lime and gold gradient background`],

  // ---- // 02 Our process (5 step) — cùng 6 người đó, chuyền việc theo quy trình ----
  ["step-1-concept", `${cast("maya", "rio")}. MAYA in front grips a giant pencil like a spear and draws a glowing outline in the air that is materialising into a chunky cartoon monster; RIO leans in behind her pointing at the sketch, both excited, sketch lines and idea sparks around, warm yellow and amber gradient background`],
  ["step-2-prototype", `${cast("bruno", "rio")}. Hard diagonal split: on BRUNO's side behind, plain grey blocky greybox terrain he is bolting together; RIO in front drags a shimmering wave of colour across the frame turning it into a fully rendered colourful game world, grey to magenta gradient`],
  ["step-3-production", `The full squad of six charging side by side toward the camera in one line, dust cloud behind them, each carrying their own tool: ${cast("maya", "rio", "kenji", "vee", "bruno", "pip")}, purple and pink gradient sky`],
  ["step-4-integration-qa", `${cast("pip", "kenji")}. PIP swings a huge cartoon hammer down onto a fleeing bug monster while KENJI checks three big phones standing in a row behind showing the same game build, checklist ticks popping in the air, teal and orange gradient background`],
  ["step-5-launch-liveops", `${cast("maya", "vee", "bruno")}. A massive cartoon rocket blasts up out of a giant smartphone with MAYA riding the nose cone arm raised, VEE and BRUNO cheering below, confetti, coins and a banner ribbon swirling, dramatic upward camera angle, sunset pink and violet gradient sky`],
];

if (!KEY) throw new Error("ADMIN_SECRET chưa có trong .env.local");

async function gen([id, subject, tail = HANDMADE, size = "1536x1024"]) {
  const prompt = `${STYLE}. ${subject}. ${tail}`;
  const res = await fetch(`${APP}/api/admin/generate-image`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-admin-key": KEY },
    body: JSON.stringify({ prompt, size, noText: true }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return console.error(`✗ ${id}: ${json.error ?? res.status}`);
  console.log(`${id}\t${json.url}`);
}

// ponytail: 3 request một lượt — mỗi ảnh ~40s, chạy tuần tự 11 ảnh là 8 phút,
// mà backend ảnh hay 429 nếu bắn hết cùng lúc.
const list = SHOTS.filter(([id]) => !only.length || only.some((p) => id.startsWith(p)));
for (let i = 0; i < list.length; i += 3) {
  await Promise.all(list.slice(i, i + 3).map(gen));
}
