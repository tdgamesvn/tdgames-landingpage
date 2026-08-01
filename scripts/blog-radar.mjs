// Blog radar — quét tin ngành game art mỗi sáng, nhờ AI lọc 5 chủ đề đáng viết,
// đẩy vào Discord cho CEO chọn.
//
// Usage:
//   node --env-file=.env.local scripts/blog-radar.mjs --dry-run   (in ra console)
//   node --env-file=.env.local scripts/blog-radar.mjs             (gửi Discord)
//
// Env: AI_BASE_URL, AI_API_KEY, AI_MODEL, DISCORD_WEBHOOK_URL,
//      SUPABASE_URL, SUPABASE_ACCESS_TOKEN

const DRY = process.argv.includes("--dry-run");

// ponytail: bỏ RSS của Reddit — trả 429 cả từ máy nhà lẫn server (chặn IP
// datacenter). Muốn thêm Reddit thì phải qua OAuth API, chưa đáng.
// ponytail: bỏ GamesIndustry.biz — đo 11 topic đầu tiên thì nó đóng góp ĐÚNG 0.
// Nó là báo thương mại (funding/doanh thu/layoffs), không phải nơi bàn art pipeline.
// 80 Level đẻ 10/11 topic nên cho nó hạn ngạch gấp đôi.
const FEEDS = [
  { name: "80 Level", url: "https://80.lv/feed/", limit: 24 },
  { name: "Game Developer", url: "https://www.gamedeveloper.com/rss.xml", limit: 12 },
  { name: "CGPress", url: "https://cgpress.org/feed", limit: 12 },
];

// Lọc thô TRƯỚC khi tốn token AI: tin không có lấy một chữ nào về art/animation/vfx
// thì khỏi đưa vào danh sách. AI đọc ít tin rác thì chọn trúng hơn.
const ART_WORDS = /\b(art|artist|animat|vfx|effect|shader|render|texture|material|sprite|pixel|2d|3d|rig|spine|character|environment|concept|illustrat|visual|style|stylized|lighting|particle|motion|cutscene|cinematic|ui|ux|asset|pipeline|workflow|blender|substance|photoshop|maya|unreal|unity|outsourc|studio|indie|game ?dev)/i;

const decode = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();

// ponytail: regex thay vì thư viện parse XML — chỉ cần title + link, feed nào
// lạ quá thì bỏ qua item đó chứ không làm hỏng cả lần chạy.
function parseFeed(xml, limit) {
  return xml
    .split(/<(?:item|entry)[\s>]/)
    .slice(1, limit + 1)
    .map((block) => {
      const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "";
      const link =
        block.match(/<link[^>]*href="([^"]+)"/)?.[1] ??
        block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ??
        "";
      return { title: decode(title), link: decode(link) };
    })
    .filter((i) => i.title);
}

async function fetchFeed({ name, url, limit }) {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "tdgames-blog-radar/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseFeed(await res.text(), limit ?? 12).map((i) => ({ ...i, source: name }));
  } catch (err) {
    console.error(`[radar] bỏ qua ${name}: ${err.message}`);
    return [];
  }
}

const PROMPT = `Bạn là biên tập viên nội dung của TD Games — studio Việt Nam nhận outsourcing 2D game art, animation (Spine) và VFX cho các studio game nước ngoài.

Blog này có ĐÚNG MỘT việc: khiến người đang cân nhắc thuê studio outsource art tin rằng TD Games làm được việc. Hai tệp người đọc:
1. Art director / producer / studio lead đang tìm đối tác outsource 2D art, animation hoặc VFX.
2. Game developer tự làm art, đang mắc ở khâu sản xuất — họ đọc rồi nhận ra tự làm tốn hơn thuê.

Dưới đây là headline đang được chú ý trong ngành. Chọn ĐÚNG 5 chủ đề TD Games nên viết.

ƯU TIÊN (theo thứ tự):
- Chủ đề chạm trực tiếp 2D art / animation (Spine) / VFX cho game — cái TD Games bán.
- Chủ đề về quy trình sản xuất, bàn giao, phối hợp với studio thuê ngoài, kiểm soát chất lượng, engine-ready asset. Đây là thứ người sắp thuê outsource lo nhất.
- Chủ đề mà chỉ studio làm nghề thật mới viết nổi: con số thật, lỗi thật, cách xử lý thật.

LOẠI BỎ:
- Tin thuần thương mại: gọi vốn, doanh thu, sa thải, thương vụ.
- Tin chỉ nói về game hay/dở, review, cốt truyện.
- Chủ đề 3D nặng, lập trình gameplay, engine internals — không phải cái TD Games bán.
- Chủ đề chung chung ai cũng viết được, không có chỗ cho trải nghiệm studio.

Với mỗi chủ đề, trả về:
- "topic": góc bài cụ thể, TIẾNG VIỆT, tối đa 18 từ
- "why": vì sao bài này kéo được đúng người đang cân nhắc thuê outsource, TIẾNG VIỆT, 1 câu
- "ask": MỘT câu hỏi để CEO trả lời bằng trải nghiệm thật (dự án cụ thể, con số, sự cố), TIẾNG VIỆT
- "source": link tin gốc liên quan nhất

Chỉ trả về JSON: {"topics":[{"topic":"","why":"","ask":"","source":""}]}`;

async function pickTopics(items) {
  const list = items
    .map((i, n) => `${n + 1}. [${i.source}] ${i.title} — ${i.link}`)
    .join("\n");

  const res = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL,
      messages: [
        { role: "system", content: PROMPT },
        { role: "user", content: list },
      ],
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`);
  const raw = (await res.json()).choices?.[0]?.message?.content ?? "";
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error(`AI không trả JSON: ${raw.slice(0, 200)}`);
  return JSON.parse(json).topics ?? [];
}

async function sendDiscord(topics, scanned) {
  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });

  const res = await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "Blog Radar",
      embeds: [
        {
          title: `📡 5 chủ đề blog đáng viết — ${today}`,
          description:
            "Chọn 1 chủ đề, trả lời câu hỏi ở cuối bằng trải nghiệm thật (gõ hoặc ghi âm cũng được). Phần còn lại để AI dựng bài.",
          color: 0xf59e0b,
          fields: topics.slice(0, 5).map((t, i) => ({
            name: `${i + 1}. ${t.topic}`,
            value: `${t.why}\n**Kể nghe:** ${t.ask}\n[tin gốc](${t.source})`.slice(0, 1024),
          })),
          footer: { text: `Quét ${scanned} tin từ ${FEEDS.length} nguồn` },
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Discord ${res.status}: ${await res.text()}`);
}

const SUPA = () => ({
  apikey: process.env.SUPABASE_ACCESS_TOKEN,
  authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
});

/** So tiêu đề bỏ dấu câu / hoa thường / khoảng trắng thừa — AI hay đẻ lại cùng ý khác chữ. */
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Đã gợi ý gì trong 30 ngày. Khoá chính là `source` (URL bài gốc) chứ KHÔNG phải
 * tiêu đề: đo thực tế thấy cùng một bài 80.lv đẻ ra 3 tiêu đề khác chữ nhưng cùng
 * một ý ("Quy trình làm sương volumetric…" / "Quy trình dựng volumetric fog…" /
 * "Dựng sương thể tích…"). So chuỗi tiêu đề không bao giờ bắt được kiểu đó.
 * Vẫn giữ thêm tập tiêu đề đã chuẩn hoá để chặn trường hợp trùng ý khác nguồn.
 */
async function recentTopics() {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/blog_topics?select=topic,source&created_at=gte.${since}`,
    { headers: SUPA() },
  );
  if (!res.ok) return { sources: new Set(), titles: new Set() }; // DB hỏng thì trùng còn hơn mất tin
  const rows = await res.json();
  return {
    sources: new Set(rows.map((r) => r.source).filter(Boolean)),
    titles: new Set(rows.map((r) => norm(r.topic))),
  };
}

/**
 * Tin quá 7 ngày thì hết thời sự — tự chuyển `new` → `skipped` để panel admin
 * chỉ còn chủ đề trong tuần, không phình vô hạn (mỗi sáng +5).
 */
async function expireOld() {
  const cutoff = new Date(Date.now() - 7 * 864e5).toISOString();
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/blog_topics?status=eq.new&created_at=lt.${cutoff}`,
    {
      method: "PATCH",
      headers: { ...SUPA(), "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify({ status: "skipped" }),
    },
  );
  if (!res.ok) {
    console.error(`[radar] không dọn được topic cũ: ${res.status}`);
    return 0;
  }
  return (await res.json()).length;
}

async function saveTopics(topics) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/blog_topics`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: process.env.SUPABASE_ACCESS_TOKEN,
      authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      prefer: "return=representation",
    },
    body: JSON.stringify(
      topics.map((t) => ({
        topic: t.topic,
        why: t.why,
        ask: t.ask,
        source: t.source,
      })),
    ),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

const items = (await Promise.all(FEEDS.map(fetchFeed))).flat();
if (!items.length) {
  console.error("[radar] không lấy được tin nào — thoát");
  process.exit(1);
}
const relevant = items.filter((i) => ART_WORDS.test(i.title));
console.error(`[radar] quét ${items.length} tin → ${relevant.length} tin dính art/animation/vfx`);
if (!relevant.length) {
  console.error("[radar] không tin nào liên quan — thoát");
  process.exit(0);
}

const picked = await pickTopics(relevant);
if (!picked.length) {
  console.error("[radar] AI không chọn được chủ đề nào — thoát");
  process.exit(1);
}

const seen = await recentTopics();
const topics = picked.filter((t) => !seen.sources.has(t.source) && !seen.titles.has(norm(t.topic)));
if (picked.length !== topics.length) {
  console.error(`[radar] bỏ ${picked.length - topics.length} chủ đề đã gợi ý trong 30 ngày`);
}

if (DRY) {
  for (const [i, t] of topics.entries()) {
    console.log(`\n${i + 1}. ${t.topic}\n   ${t.why}\n   Kể nghe: ${t.ask}\n   ${t.source}`);
  }
} else {
  const expired = await expireOld();
  if (expired) console.error(`[radar] dọn ${expired} chủ đề quá 7 ngày → skipped`);

  if (!topics.length) {
    console.error("[radar] không có chủ đề mới nào — không làm phiền sếp");
  } else {
    const saved = await saveTopics(topics);
    console.error(`[radar] lưu ${saved.length} chủ đề vào blog_topics`);
    await sendDiscord(topics, relevant.length);
    console.error(`[radar] đã gửi ${topics.length} chủ đề vào Discord`);
  }
}
