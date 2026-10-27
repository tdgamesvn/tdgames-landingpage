// Tạo / cập nhật tài khoản Sếp cho /hr và in link đặt mật khẩu (token mời, 7 ngày).
// Dùng: node --env-file=.env.local scripts/hr-create-boss.mjs --email a@b.com --name "Tên" [--origin http://localhost:3000]
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const email = arg("email")?.trim().toLowerCase();
const name = arg("name")?.trim();
const origin = (arg("origin") ?? "https://tdgamestudio.com").replace(/\/$/, "");
if (!email || !name) {
  console.error('Thiếu tham số: --email <email> --name "<tên>" [--origin <url>]');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ACCESS_TOKEN;
if (!url || !key) {
  console.error("Thiếu SUPABASE_URL / SUPABASE_ACCESS_TOKEN (chạy với --env-file=.env.local)");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

// Khớp newToken() ở src/lib/hr-crypto.ts: 32 byte base64url, DB lưu sha256 hex.
const token = randomBytes(32).toString("base64url");
const hash = createHash("sha256").update(token).digest("hex");

const { data: user, error } = await supabase
  .from("hr_users")
  .upsert({ email, display_name: name, role: "boss", disabled: false }, { onConflict: "email" })
  .select("id")
  .single();
if (error) {
  console.error("Lỗi tạo hr_users:", error.message);
  process.exit(1);
}

// Xoá lời mời cũ chưa dùng rồi tạo mới.
await supabase.from("hr_user_tokens").delete().eq("user_id", user.id).eq("purpose", "invite").is("used_at", null);
const { error: tokenError } = await supabase.from("hr_user_tokens").insert({
  token_hash: hash,
  user_id: user.id,
  purpose: "invite",
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
});
if (tokenError) {
  console.error("Lỗi tạo token:", tokenError.message);
  process.exit(1);
}

console.log(`Đã tạo/cập nhật Sếp: ${email}`);
console.log(`Link đặt mật khẩu (7 ngày): ${origin}/hr/set-password?token=${token}`);
