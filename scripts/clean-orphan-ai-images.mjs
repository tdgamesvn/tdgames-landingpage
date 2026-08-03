// Dọn ảnh AI mồ côi: ảnh đã sinh ra nhưng không còn chỗ nào tham chiếu.
// Mỗi lần bấm "Render lại ảnh" là ảnh cũ bị bỏ lại trên R2 + media_assets —
// sau vài chục lần thì tab Media toàn rác. Script này quét và dọn.
//
// Chạy trên VPS (R2 creds nằm ở đó):
//   node --env-file=.env.local scripts/clean-orphan-ai-images.mjs          # dry-run
//   node --env-file=.env.local scripts/clean-orphan-ai-images.mjs --apply  # xoá thật
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const APPLY = process.argv.includes("--apply");

// Ảnh vừa render mà sếp chưa bấm Save thì CHƯA có ai tham chiếu — xoá là mất
// trắng công render. Chỉ đụng vào ảnh đã nằm im đủ lâu.
const MIN_AGE_MINUTES = 60;

// ponytail: hard-code danh sách bảng thay vì đọc information_schema. Thêm bảng
// mới có chứa URL ảnh thì PHẢI thêm vào đây, không thì script xoá nhầm ảnh đang
// dùng. Script in ra danh sách đã quét mỗi lần chạy để chỗ này không âm thầm cũ đi.
const TABLES_TO_SCAN = ["blog_posts", "page_slots", "projects", "team_members", "jobs"];

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ACCESS_TOKEN;
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("thiếu SUPABASE_URL / SUPABASE_ACCESS_TOKEN");

async function rest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

// Gom TẤT CẢ nội dung các bảng thành một chuỗi rồi tìm URL trong đó. Thô nhưng
// không bỏ sót cột nào — thà giữ nhầm một ảnh còn hơn xoá nhầm ảnh đang hiển thị.
let haystack = "";
for (const table of TABLES_TO_SCAN) {
  try {
    haystack += JSON.stringify(await rest(`${table}?select=*`));
    console.log(`  đã quét ${table}`);
  } catch (e) {
    // Bảng không tồn tại thì bỏ qua; bảng lỗi mạng thì DỪNG, không được đoán bừa.
    if (!String(e.message).includes("42P01") && !String(e.message).includes("404")) throw e;
    console.log(`  bỏ qua ${table} (không có bảng)`);
  }
}

const assets = await rest("media_assets?ai_prompt=not.is.null&select=id,current_url,r2_key,created_at");
const cutoff = Date.now() - MIN_AGE_MINUTES * 60_000;

const orphans = assets.filter((a) => {
  if (!a.current_url) return false;
  if (new Date(a.created_at).getTime() > cutoff) return false; // còn quá mới
  return !haystack.includes(a.current_url);
});
const tooNew = assets.filter((a) => new Date(a.created_at).getTime() > cutoff).length;

console.log(
  `\n${assets.length} ảnh AI · ${assets.length - orphans.length - tooNew} đang dùng · ` +
    `${orphans.length} mồ côi · ${tooNew} mới dưới ${MIN_AGE_MINUTES} phút (bỏ qua)`,
);
if (!orphans.length) process.exit(0);
for (const o of orphans) console.log(`  ${o.created_at.slice(0, 16)}  ${o.current_url}`);

if (!APPLY) {
  console.log(`\nDry-run. Thêm --apply để xoá ${orphans.length} ảnh trên khỏi R2 + media_assets.`);
  process.exit(0);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT ?? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

let deleted = 0;
for (const o of orphans) {
  // Xoá file TRƯỚC, xoá row SAU: đứt gánh giữa chừng thì còn row trỏ tới file đã
  // mất (lần chạy sau dọn nốt), chứ không để lại file không ai biết đường tìm.
  if (o.r2_key) {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: o.r2_key }));
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/media_assets?id=eq.${o.id}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`xoá row ${o.id} lỗi: ${await res.text()}`);
  deleted++;
}
console.log(`\nĐã xoá ${deleted} ảnh mồ côi.`);
