// Gắn ảnh bìa đã duyệt (output của gen-portfolio-covers.mjs) lên production:
// POST /api/admin/upload (→ R2, tự nén WebP) rồi PATCH /api/projects { id, image } —
// đúng hai route mà tab Projects ở /admin dùng, không đụng DB trực tiếp.
//
// Usage (cần `npm run dev` đang chạy; chạy ngoài sandbox vì sandbox chặn localhost):
//   node --env-file=.env.local scripts/apply-portfolio-covers.mjs v2            # cả thư mục
//   node --env-file=.env.local scripts/apply-portfolio-covers.mjs v2 kayn-snow-moon
//
// Ghi map slug → ảnh cũ / ảnh mới ra scripts/.out/portfolio-covers/applied-<variant>.json
// để rollback: PATCH lại `image` cũ. Ảnh cũ vẫn nằm nguyên trên CDN.
import { readdir, readFile, writeFile } from "node:fs/promises";

const APP = process.env.APP_URL ?? "http://[::1]:3000"; // [::1]: xem gen-job-covers.mjs
const [variant, ...only] = process.argv.slice(2);
if (!variant) throw new Error("Thiếu tên variant, vd: v2");
const DIR = `scripts/.out/portfolio-covers/${variant}`;

// Cùng lý do với gen-job-covers.mjs: requireAdmin ưu tiên app_settings.admin_secret.
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

const KEY = await getAdminKey();
if (!KEY) throw new Error("Không lấy được admin secret");
const H = { "x-admin-key": KEY };

const { projects = [] } = await (await fetch(`${APP}/api/projects?limit=100`)).json();
const bySlug = new Map(projects.map((p) => [p.slug, p]));

const files = (await readdir(DIR)).filter((f) => f.endsWith(".png"));
const applied = [];
for (const f of files) {
  const slug = f.replace(/\.png$/, "");
  if (only.length && !only.includes(slug)) continue;
  const project = bySlug.get(slug);
  if (!project) {
    console.error(`✗ ${slug}: không có trong bảng projects`);
    continue;
  }

  const form = new FormData();
  form.set("file", new Blob([await readFile(`${DIR}/${f}`)], { type: "image/png" }), `portfolio-cover-${slug}.png`);
  const up = await fetch(`${APP}/api/admin/upload`, { method: "POST", headers: H, body: form });
  const upJson = await up.json().catch(() => ({}));
  if (!up.ok || !upJson.url) {
    console.error(`✗ ${slug}: upload ${up.status} ${upJson.error ?? ""}`);
    continue;
  }

  const patch = await fetch(`${APP}/api/projects`, {
    method: "PATCH",
    headers: { ...H, "content-type": "application/json" },
    body: JSON.stringify({ id: project.id, image: upJson.url }),
  });
  if (!patch.ok) {
    console.error(`✗ ${slug}: PATCH ${patch.status} (ảnh đã lên R2: ${upJson.url})`);
    continue;
  }
  applied.push({ slug, id: project.id, old: project.image, new: upJson.url });
  console.log(`✓ ${slug}\t${upJson.url}`);
}

await writeFile(`scripts/.out/portfolio-covers/applied-${variant}.json`, JSON.stringify(applied, null, 2));
console.log(`${applied.length}/${files.length} đã gắn`);
