// Blog radar — quét tin ngành game art mỗi sáng, nhờ AI lọc 5 chủ đề đáng viết,
// đẩy vào Discord cho CEO chọn.
//
// Usage:
//   node --env-file=.env.local scripts/blog-radar.mjs --dry-run   (in ra console)
//   node --env-file=.env.local scripts/blog-radar.mjs             (gửi Discord)
//
// Env: AI_BASE_URL, AI_API_KEY, AI_MODEL, DISCORD_WEBHOOK_URL

const DRY = process.argv.includes("--dry-run");

// ponytail: bỏ RSS của Reddit — trả 429 cả từ máy nhà lẫn server (chặn IP
// datacenter). Muốn thêm Reddit thì phải qua OAuth API, chưa đáng.
const FEEDS = [
  { name: "Game Developer", url: "https://www.gamedeveloper.com/rss.xml" },
  { name: "80 Level", url: "https://80.lv/feed/" },
  { name: "GamesIndustry.biz", url: "https://www.gamesindustry.biz/feed" },
];

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

async function fetchFeed({ name, url }) {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "tdgames-blog-radar/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseFeed(await res.text(), 12).map((i) => ({ ...i, source: name }));
  } catch (err) {
    console.error(`[radar] bỏ qua ${name}: ${err.message}`);
    return [];
  }
}

const PROMPT = `Bạn là biên tập viên nội dung của TD Games — studio Việt Nam nhận outsourcing 2D game art, animation (Spine) và VFX cho các studio game nước ngoài.

Dưới đây là headline đang được chú ý trong ngành tuần này. Chọn ĐÚNG 5 chủ đề mà TD Games nên viết blog, ưu tiên chủ đề mà một studio làm nghề thật mới nói được — kỹ thuật sản xuất, quy trình, bài học thực chiến. Bỏ qua tin thuần thương mại (gọi vốn, doanh thu, sa thải) và tin không dính tới 2D art/animation/VFX.

Với mỗi chủ đề, trả về:
- "topic": góc bài cụ thể, viết TIẾNG VIỆT, tối đa 18 từ
- "why": vì sao TD Games viết được bài này thuyết phục hơn người khác, TIẾNG VIỆT, 1 câu
- "ask": MỘT câu hỏi để CEO trả lời bằng trải nghiệm thật của studio, TIẾNG VIỆT
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

const items = (await Promise.all(FEEDS.map(fetchFeed))).flat();
if (!items.length) {
  console.error("[radar] không lấy được tin nào — thoát");
  process.exit(1);
}
console.error(`[radar] quét ${items.length} tin`);

const topics = await pickTopics(items);
if (!topics.length) {
  console.error("[radar] AI không chọn được chủ đề nào — thoát");
  process.exit(1);
}

if (DRY) {
  for (const [i, t] of topics.entries()) {
    console.log(`\n${i + 1}. ${t.topic}\n   ${t.why}\n   Kể nghe: ${t.ask}\n   ${t.source}`);
  }
} else {
  await sendDiscord(topics, items.length);
  console.error(`[radar] đã gửi ${topics.length} chủ đề vào Discord`);
}
