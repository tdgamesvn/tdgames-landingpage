// Auto blog — chạy ngay sau blog-radar mỗi sáng: chọn chủ đề đáng viết nhất còn
// tồn, nhờ AI dựng bài (dùng lại POST /api/admin/blog/topics), rồi tự publish.
//
// Bật/tắt + số bài mỗi ngày nằm ở app_settings, sửa trong /admin tab Blog:
//   blog_auto_enabled = "1" | "0"     blog_auto_count = "1".."3"
//
// Usage:
//   node --env-file=.env.local scripts/blog-auto.mjs --dry-run   (chỉ in chủ đề sẽ chọn)
//   node --env-file=.env.local scripts/blog-auto.mjs
//
// Env: SUPABASE_URL, SUPABASE_ACCESS_TOKEN, ADMIN_SECRET (fallback), APP_URL,
//      DISCORD_WEBHOOK_URL

const DRY = process.argv.includes("--dry-run");
const APP = process.env.APP_URL ?? "http://127.0.0.1:3000";
const SITE = "https://tdgamestudio.com";
const MAX_PER_DAY = 3; // trần cứng: mỗi bài đốt 1 lần gọi AI + 2-5 ảnh

const SUPA = {
  apikey: process.env.SUPABASE_ACCESS_TOKEN,
  authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
  "content-type": "application/json",
};

async function rest(path, init = {}) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...SUPA, ...init.headers },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.status === 204 ? null : res.json();
}

/** Chất liệu thật của sếp cho một chủ đề: bộ phỏng vấn đã trả lời, hoặc note tự do. */
function material(t) {
  const answers = (Array.isArray(t.interview) ? t.interview : [])
    .filter((x) => String(x?.a ?? "").trim())
    .map((x) => ({ q: x.q, a: x.a }));
  if (answers.length) return { answers, chars: answers.reduce((n, a) => n + a.a.length, 0) };
  const note = String(t.ceo_note ?? "").trim();
  return { ceo_note: note, chars: note.length };
}

const settings = Object.fromEntries(
  (await rest("app_settings?select=key,value")).map((r) => [r.key, r.value]),
);

// --dry-run xem trước được cả khi đang tắt (nó không viết gì).
if (!DRY && settings.blog_auto_enabled !== "1") {
  console.error("[auto-blog] đang TẮT (blog_auto_enabled != 1) — không làm gì");
  process.exit(0);
}
const want = Math.min(MAX_PER_DAY, Math.max(1, Number(settings.blog_auto_count) || 1));
const adminKey = settings.admin_secret || process.env.ADMIN_SECRET;
if (!adminKey) {
  console.error("[auto-blog] không có admin key — thoát");
  process.exit(1);
}

// Chỉ chủ đề chưa dựng bài. `post_id is null` là chốt chặn thật: route đặt
// status=drafted + post_id sau khi tạo, nên không bao giờ viết lại một chủ đề.
const topics = await rest(
  "blog_topics?select=id,topic,score,ceo_note,interview&status=in.(new,picked)&post_id=is.null&order=created_at.desc&limit=60",
);

// Chủ đề sếp đã kể chuyện thật luôn xếp trước — bài có chất liệu thật ăn đứt bài
// AI tự nghĩ. Hết chất liệu thì mới rơi xuống chế độ auto (route tự cấm bịa số).
const queue = topics
  .map((t) => ({ ...t, mat: material(t) }))
  .sort((a, b) => {
    const real = (x) => (x.mat.chars >= 40 ? 1 : 0);
    return real(b) - real(a) || (b.score ?? 0) - (a.score ?? 0);
  })
  .slice(0, want);

if (!queue.length) {
  console.error("[auto-blog] không còn chủ đề nào chưa dựng bài — thoát");
  process.exit(0);
}

if (DRY) {
  for (const t of queue) {
    console.log(
      `- [${t.score ?? "?"}/10] ${t.topic}\n  chất liệu: ${t.mat.chars} ký tự ${t.mat.chars >= 40 ? "(bài từ trải nghiệm thật)" : "(AI tự viết)"}`,
    );
  }
  process.exit(0);
}

const done = [];
for (const t of queue) {
  try {
    console.error(`[auto-blog] dựng bài: ${t.topic}`);
    const res = await fetch(`${APP}/api/admin/blog/topics`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-key": adminKey },
      // auto:true = bỏ qua chốt "cần 40 ký tự"; route vẫn dùng note nếu có.
      body: JSON.stringify(
        t.mat.answers
          ? { id: t.id, auto: true, answers: t.mat.answers }
          : { id: t.id, auto: true, ceo_note: t.mat.ceo_note },
      ),
      signal: AbortSignal.timeout(300_000),
    });
    if (!res.ok) throw new Error(`draft ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const { post } = await res.json();

    // Route hardcode published:false (sếp là chốt chặn khi bấm tay). Luồng auto
    // thì chính chỗ này là quyết định "tự đăng" — để lộ thiên ở đây, không nhét
    // thêm cờ vào route dùng chung.
    await rest(`blog_posts?id=eq.${post.id}`, {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({ published: true, updated_at: new Date().toISOString() }),
    });
    console.error(`[auto-blog] đã đăng: ${SITE}/blog/${post.slug}`);
    done.push({ ...post, real: t.mat.chars >= 40 });
  } catch (err) {
    // Một bài hỏng không được kéo theo bài còn lại.
    console.error(`[auto-blog] hỏng "${t.topic}": ${err.message}`);
  }
}

if (done.length && process.env.DISCORD_WEBHOOK_URL) {
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "Blog Radar",
      embeds: [
        {
          title: `✍️ Đã tự đăng ${done.length} bài blog`,
          description: done
            .map(
              (p) =>
                `**[${p.title}](${SITE}/blog/${p.slug})**\n${p.real ? "từ ghi chú thật của sếp" : "AI tự viết từ chủ đề"} — sửa hoặc gỡ ở /admin`,
            )
            .join("\n\n")
            .slice(0, 4000),
          color: 0xf59e0b,
        },
      ],
    }),
  }).catch((err) => console.error(`[auto-blog] Discord lỗi: ${err.message}`));
}

// Bật auto mà không ra bài nào = có gì đó hỏng, cho Action đỏ để còn biết.
if (!done.length) process.exit(1);
