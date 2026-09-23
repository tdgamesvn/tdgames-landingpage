// Sinh ảnh cover cho các vị trí tuyển dụng (bảng `jobs`) bằng ĐÚNG luồng ảnh AI của
// blog/service: POST /api/admin/generate-image → gpt-image (cliproxyapi) → R2 → media_assets.
//
// Usage (cần `npm run dev` đang chạy + cliproxyapi ở localhost:8317):
//   node --env-file=.env.local scripts/gen-job-covers.mjs                 # tất cả
//   node --env-file=.env.local scripts/gen-job-covers.mjs graphic-designer # 1 slug
//
// In ra `slug → url`. Gắn vào DB bằng UPDATE jobs SET image_url = ... WHERE slug = ...
//
// ponytail: [::1] chứ không phải 127.0.0.1 — next dev bind IPv6, còn IPv4:3000 trên
// máy này hay bị vite của tdgames-platforms chiếm (POST rơi vào đó → 404 rỗng).
const APP = process.env.APP_URL ?? "http://[::1]:3000";
const only = process.argv.slice(2);

// ponytail: KHÔNG đọc thẳng process.env.ADMIN_SECRET — `requireAdmin` ưu tiên row
// `app_settings.admin_secret` trong DB, và .env.local trên máy dev đã lệch với DB
// (y hệt vụ đổi hr_secret session 30d) → gọi API là 401 mà tưởng code hỏng.
// Lấy đúng nguồn mà server dùng; không bao giờ in key ra stdout.
async function getAdminKey() {
  const url = process.env.SUPABASE_URL;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (url && token) {
    const res = await fetch(
      `${url.replace(/\/+$/, "")}/rest/v1/app_settings?key=eq.admin_secret&select=value`,
      { headers: { apikey: token, authorization: `Bearer ${token}` } },
    );
    if (res.ok) {
      const rows = await res.json().catch(() => []);
      if (rows?.[0]?.value) return rows[0].value;
    }
  }
  return process.env.ADMIN_SECRET ?? "";
}

// Gu chung — copy nguyên từ gen-service-images.mjs để cover tuyển dụng đứng chung
// một bộ với 11 ảnh service + hero Full Game Production. Đồng bộ nằm ở NGÔN NGỮ TẠO
// HÌNH (toon 3D render, outline dày, rim light, nền gradient rực), không phải bối cảnh.
const STYLE =
  "Supercell-style mobile game key art (Squad Busters / Brawl Stars look): stylised 3D-rendered cartoon characters with thick dark outlines, chunky exaggerated proportions, oversized heads hands and feet, huge over-the-top facial expressions mid-shout, glossy toon shading with strong rim light and crisp cast shadows, punchy high-contrast saturated colours over a vivid glowing gradient sky, dynamic action composition with the subject charging toward the camera in wide-angle foreshortening, motion dust puffs and chunky impact shapes, clean depth-blurred background, bold arcade poster energy";

// ponytail: cover job bị crop HAI KIỂU khác nhau — list card ở /careers là khung dọc
// hẹp (w-44, object-cover) còn panel chi tiết là dải ngang 640x224. Nên bắt chủ thể nằm
// gọn giữa khung với lề rộng cả 4 phía, crop kiểu nào cũng không cụt đầu.
// ponytail: ĐỪNG xin 1024x1024. Generator luôn trả khung ngang ~3:2 bất kể `size`, rồi
// `generateAiImage` ép về vuông bằng fit:"contain" → độn hai dải đen trên/dưới (thử lần
// đầu: 1024x1024 trim ra còn 1024x686). Xin thẳng 1536x1024 thì khớp tỉ lệ gốc, ảnh sạch.
const JOB_TAIL =
  "polished stylised 3D toon render, one clear hero subject centred in the frame at half height, generous empty gradient margin on all four sides and especially above the head and below the feet, because this artwork gets cropped both to a narrow vertical thumbnail and to a wide short banner. Must NOT be: photo-real, muted or desaturated, dark or near-black, gritty, or cluttered with tiny background props. Avoid the generic AI look: no lens flares, no ring of small icons orbiting the subject, no perfectly symmetrical layout, no chrome or glass gradients";

// ROSTER — 6 nhân vật core khoá cứng, y hệt gen-service-images.mjs. Ai đã có mặt ở
// ảnh service thì cover tuyển dụng phải là ĐÚNG người đó, không thiết kế lại.
const CHARS = {
  maya: "MAYA the game designer, a young woman with black curly hair pulled into a high puff, round tortoiseshell glasses, a brown flat cap, a mustard-yellow shirt with rolled sleeves and a pencil behind her ear",
  rio: "RIO the art director, a young woman with short hot-pink hair, a white beret spattered with paint, white dungarees covered in colourful paint smears and a red neckerchief",
  kenji: "KENJI the animator, a lanky young man with spiky blond hair and a blue headband, a cobalt-blue hoodie with rolled sleeves, baggy shorts and chunky orange sneakers",
  vee: "VEE the VFX artist, a girl with dark brown skin and purple hair in two buns, orange flight goggles pushed up on her forehead, an orange flight suit and big glowing cyan gloves",
  bruno: "BRUNO the developer, a stocky bearded man with a red beard, a green hard hat, a grey engineer's jumpsuit with a tool belt and heavy brown boots",
  pip: "PIP the QA tester, a small wiry girl with platinum-white hair in a ponytail, a yellow hard hat, a bright orange hi-vis vest over a teal tee and a clipboard on her hip",

  // 4 người MỚI — roster cũ chỉ có bộ phận sản xuất, không ai đại diện cho graphic
  // design / marketing / BD / PM. Mô tả phải chi tiết ngang 6 người trên để lần gen
  // sau ra đúng nhân vật này, và phải KHÁC RIO rõ ràng (Zoe hay bị gen thành Rio).
  zoe: "ZOE the graphic designer, a young woman with straight jet-black bobbed hair and a blunt fringe, thick square black-rimmed glasses, small gold hoop earrings, a cream oversized sweatshirt with rolled cuffs over black trousers and white trainers, a stylus tucked behind one ear",
  milo: "MILO the marketing executive, a cheerful young man with wavy chestnut hair and a small ponytail, a teal bomber jacket over a white tee, round wireless headphones slung around his neck and a phone in one hand",
  hana: "HANA the business development lead, a confident young woman with long dark hair in a high ponytail, a crisp navy blazer over a white shirt with the sleeves pushed up, gold stud earrings and a tablet under one arm",
  tam: "TAM the project assistant, a tidy young man with neat black hair and small round glasses, a light-grey cardigan over a striped shirt, a lanyard badge around his neck and a stack of sticky-note pads in one hand",
};
const cast = (...keys) => keys.map((k) => CHARS[k]).join("; ");

// [slug trong bảng jobs, subject]
// ponytail: tối đa 2 nhân vật/prompt — LOG session 21 ghi rõ liệt kê 6 người làm
// image API timeout. Mỗi shot có palette riêng để 7 cover xếp cạnh nhau không lẫn.
const SHOTS = [
  ["2d-game-artist",
    `${cast("rio")}. She stands centred swinging an oversized paintbrush overhead like a sword, a thick arc of magenta and orange paint splashing behind her and a freshly painted chunky cartoon hero bust rising out of the splash beside her, colour swatch cards fanning through the air, hot pink and tangerine gradient background`],

  ["2d-spine-animator",
    `${cast("kenji")}. He stands centred pulling a glowing curved animation timeline around himself like a bow string, four key poses of a chunky cartoon monster mid-run frozen along the arc, the nearest pose showing the glowing bone rig underneath, onion-skin ghosts and motion arcs, turquoise and lime gradient background`],

  ["vfx-artist",
    `${cast("vee")}. She stands centred slamming both glowing cyan gloves together, a spiral of fire, lightning arcs and slash trails whirling around her body, sparks and chunky shockwave rings, violet and hot orange gradient background`],

  ["graphic-designer",
    `${cast("zoe")}. She stands centred holding up a huge glowing rectangular design board like a shield, the board showing a bold poster layout being assembled from floating pieces — colour swatch chips, a big letterform, a cropped artwork panel and a play button — while a second smaller floating screen beside her plays a short video clip with a scrubbing timeline under it, alignment guide lines and a grid snapping into place around the board, cobalt blue and coral gradient background`],

  ["marketing-executive",
    `${cast("milo")}. He stands centred holding a phone up in one hand with a burst of glowing heart, star and speech-bubble icons erupting out of the screen into the air, a big glowing rising arrow chart curving up behind his shoulder and three floating portfolio post cards orbiting wide around him, amber and magenta gradient background`],

  ["business-development-executive",
    `${cast("hana")}. She stands centred mid-handshake with a giant friendly cartoon robot hand reaching in from the side, a glowing contract scroll unrolling between them with a green approval tick stamped on it, a small globe with arcing flight-path lines floating behind her shoulder, deep blue and gold gradient background`],

  ["project-assistant",
    `${cast("tam")}. He stands centred juggling a fan of glowing task cards in mid-air, a giant kanban board behind him with three columns of chunky cards sliding across and a big green tick landing on the last one, a floating clock and a checklist orbiting wide around him, teal and warm yellow gradient background`],
];

const KEY = await getAdminKey();
if (!KEY) throw new Error("Không lấy được admin secret (DB app_settings lẫn env đều rỗng)");

async function gen([slug, subject]) {
  const prompt = `${STYLE}. ${subject}. ${JOB_TAIL}`;
  const res = await fetch(`${APP}/api/admin/generate-image`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-admin-key": KEY },
    body: JSON.stringify({ prompt, size: "1536x1024", noText: true }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return console.error(`✗ ${slug}: ${json.error ?? res.status}`);
  console.log(`${slug}\t${json.url}`);
}

// ponytail: 3 request một lượt — mỗi ảnh ~40s, mà backend ảnh hay 429 nếu bắn hết cùng lúc.
const list = SHOTS.filter(([slug]) => !only.length || only.includes(slug));
if (!list.length) {
  console.error(`Không khớp slug nào. Có: ${SHOTS.map(([s]) => s).join(", ")}`);
  process.exit(1);
}
for (let i = 0; i < list.length; i += 3) {
  await Promise.all(list.slice(i, i + 3).map(gen));
}
