// Render lại RIÊNG ảnh cover cho các bài blog cũ, sau khi coverRules() đổi luật
// (2026-08-17: 8/8 cover là cùng một anh cartoon đứng giữa khung).
//
// Vì sao không bấm nút "Render lại ảnh" trong /admin: nút đó render lại CẢ ảnh
// trong bài (~3 ảnh/bài) — chậm, tốn, và ảnh in-post đang không có vấn đề gì.
// Script này chỉ lấy `cover_prompt` từ reimage rồi bỏ qua `images`.
//
// Chạy vào PROD (local .env.local không có SUPABASE_SERVICE_ROLE_KEY / R2 nên
// generate-image chết ở máy):
//   node --env-file=.env.local scripts/recover-blog-covers.mjs            # dry-run
//   node --env-file=.env.local scripts/recover-blog-covers.mjs --apply
//   ... --apply --slug=<slug>    # chỉ một bài, để soi thử trước
//
// ponytail: tuần tự, không song song. 8 bài × ~60s là ~8 phút — chấp nhận được,
// và mỗi bài một request thì không đụng maxDuration/Cloudflare 100s.

const BASE = process.env.SITE_URL ?? "https://tdgamestudio.com";
const KEY = process.env.ADMIN_SECRET;
const APPLY = process.argv.includes("--apply");
const ONLY = process.argv.find((a) => a.startsWith("--slug="))?.slice(7);

if (!KEY) {
  console.error("Thiếu ADMIN_SECRET (chạy với: node --env-file=.env.local ...)");
  process.exit(1);
}

const headers = { "x-admin-key": KEY, "content-type": "application/json" };

async function api(path, init) {
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${path} → ${res.status}, không phải JSON: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${json.error ?? text.slice(0, 200)}`);
  return json;
}

const { posts } = await api("/api/admin/blog");
const targets = ONLY ? posts.filter((p) => p.slug === ONLY) : posts;

if (!targets.length) {
  console.error(ONLY ? `Không thấy bài slug="${ONLY}"` : "Không có bài nào.");
  process.exit(1);
}

console.log(`${BASE} — ${targets.length} bài${APPLY ? "" : "  (DRY-RUN, không ghi gì)"}\n`);

let ok = 0;
const failed = [];

for (const [i, post] of targets.entries()) {
  const tag = `[${i + 1}/${targets.length}] ${post.slug}`;
  try {
    // reimage trả cả prompt cho ảnh in-post; ta chỉ lấy cover.
    const plan = await api("/api/admin/blog/reimage", {
      method: "POST",
      body: JSON.stringify({
        title: post.title,
        excerpt: post.excerpt,
        content_md: post.content_md,
        cover: true,
      }),
    });
    const prompt = (plan.cover_prompt ?? "").trim();
    if (!prompt) throw new Error("AI không trả cover_prompt");
    console.log(`${tag}\n  prompt: ${prompt.slice(0, 220)}${prompt.length > 220 ? "…" : ""}`);

    if (!APPLY) {
      console.log("  → dry-run, chưa render\n");
      ok++;
      continue;
    }

    const img = await api("/api/admin/generate-image", {
      method: "POST",
      body: JSON.stringify({ prompt, size: "1536x1024", noText: true }),
    });
    await api(`/api/admin/blog/${post.id}`, {
      method: "PATCH",
      body: JSON.stringify({ cover_image: img.url }),
    });
    console.log(`  → ${img.url}\n`);
    ok++;
  } catch (e) {
    console.error(`${tag}\n  LỖI: ${e.message}\n`);
    failed.push(post.slug);
  }
}

console.log(`Xong: ${ok}/${targets.length}${failed.length ? ` — lỗi: ${failed.join(", ")}` : ""}`);
if (!APPLY) console.log("Chạy lại với --apply để render thật.");
