// Cắt dải đen letterbox khỏi ảnh AI rồi upload bản sạch lên R2.
//
// Vì sao cần: generator trả khung ngang ~3:2 nhưng KHÔNG cố định — lúc 3:2, lúc dẹt hơn
// (1536x866). `generateAiImage` ép mọi ảnh về đúng `size` bằng sharp fit:"contain", nên
// ảnh dẹt hơn bị độn hai dải #0a0a0a trên/dưới. Cover job dùng object-cover ở khung dọc
// w-44 → dải đen đó lòi ra ngay đầu và chân nhân vật.
//
// Usage: node --env-file=.env.local scripts/trim-letterbox.mjs <url> [url...]
// In ra `url cũ → url mới`. Ảnh cũ để nguyên trên R2 (dọn bằng clean-orphan-ai-images.mjs).
import sharp from "sharp";

const APP = process.env.APP_URL ?? "http://[::1]:3000";

// ponytail: y như gen-job-covers.mjs — ADMIN_SECRET trong .env.local đã lệch với DB,
// nguồn thật là row app_settings.admin_secret. Không in key ra stdout.
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

const urls = process.argv.slice(2);
if (!urls.length) {
  console.error("Cần ít nhất 1 URL ảnh");
  process.exit(1);
}

const KEY = await getAdminKey();
if (!KEY) throw new Error("Không lấy được admin secret");

for (const url of urls) {
  const src = Buffer.from(await (await fetch(url)).arrayBuffer());
  const before = await sharp(src).metadata();

  // threshold 12: nền letterbox là #0a0a0a, còn nghệ thuật bên trong sáng rực nên
  // không có nguy cơ trim ăn vào tranh.
  const trimmed = await sharp(src).trim({ threshold: 12 }).png().toBuffer();
  const after = await sharp(trimmed).metadata();

  if (before.height - after.height <= 8 && before.width - after.width <= 8) {
    console.log(`${url}\tSẠCH SẴN, bỏ qua`);
    continue;
  }

  const form = new FormData();
  form.append("file", new Blob([trimmed], { type: "image/png" }), "cover-trimmed.png");
  const res = await fetch(`${APP}/api/admin/upload`, {
    method: "POST",
    headers: { "x-admin-key": KEY },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`✗ ${url}: ${json.error ?? res.status}`);
    continue;
  }
  console.log(
    `${before.width}x${before.height} → ${after.width}x${after.height}\t${json.url ?? json.publicUrl}`,
  );
}
