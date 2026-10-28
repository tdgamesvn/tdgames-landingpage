// Đặt mã ref cho tài khoản /hr + chuẩn hoá applications.referred_by + giao người phụ trách (sếp duyệt 2026-10-28).
// Cần migration 20261028020000_assignee_ref_codes đã áp (hr_users.ref_codes, applications.assignee_user_id).
//
// Dry-run (mặc định, chỉ đọc):  node --env-file=.env.local scripts/hr-backfill-ref.mjs
// Ghi thật:                     node --env-file=.env.local scripts/hr-backfill-ref.mjs --apply
//
// Node ≥ 23.6 (import thẳng file .ts thuần).
import { createClient } from "@supabase/supabase-js";
import { canonicalRefCode, normalizeRefCode, resolveRefOwner } from "../src/lib/hr-ref-codes.ts";

const APPLY = process.argv.includes("--apply");

// Bảng sếp duyệt: email → mã ref (phần tử đầu = mã chính).
const PLAN = [
  { email: "phuongnguyen.tdgames@gmail.com", name: "Nguyễn Thị Minh Phương", ref_codes: ["minh-phuong", "phuong-hr", "phuonghr"] },
  { email: "infor@tdconsulting.vn", name: "Nguyễn Thị Thuỳ Dung", ref_codes: ["thuy-dung", "dung"] },
  { email: "toan.dang@tdgamestudio.com", name: "Đặng Thế Toàn", ref_codes: ["toan-dang", "toan"] },
];

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ACCESS_TOKEN;
if (!url || !key) {
  console.error("Thiếu SUPABASE_URL / SUPABASE_ACCESS_TOKEN (chạy với --env-file=.env.local)");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

// ── Tài khoản ────────────────────────────────────────────────────────────────
const { data: users, error: usersErr } = await supabase
  .from("hr_users")
  .select("id, email, display_name, disabled")
  .in("email", PLAN.map((p) => p.email));
if (usersErr) fail(`Lỗi đọc hr_users: ${usersErr.message}`);

// ref_codes hiện tại (chỉ đọc được khi migration đã áp).
const { data: curRefs, error: curRefsErr } = await supabase.from("hr_users").select("id, ref_codes");
const migrated = !curRefsErr;
const refById = new Map((curRefs ?? []).map((u) => [u.id, u.ref_codes ?? []]));

const owners = [];
console.log(`\n== Tài khoản (${APPLY ? "GHI THẬT" : "dry-run"}${migrated ? "" : " — migration CHƯA áp: chưa có cột ref_codes / assignee_user_id"}) ==`);
for (const p of PLAN) {
  const u = (users ?? []).find((x) => x.email === p.email);
  if (!u) fail(`Không tìm thấy tài khoản ${p.email} (${p.name})`);
  const codes = [...new Set(p.ref_codes.map(normalizeRefCode).filter(Boolean))];
  owners.push({ id: u.id, display_name: u.display_name, email: u.email, ref_codes: codes });
  console.log(
    `  ${u.display_name.padEnd(26)} ${u.email.padEnd(34)} ${JSON.stringify(migrated ? refById.get(u.id) ?? [] : "(chưa có cột)")} → ${JSON.stringify(codes)}${u.disabled ? "  [ĐÃ KHOÁ]" : ""}`,
  );
}
// Mã không được thuộc 2 tài khoản.
for (const o of owners) {
  for (const c of o.ref_codes) {
    const other = owners.find((x) => x !== o && x.ref_codes.includes(c));
    if (other) fail(`Mã "${c}" bị trùng giữa ${o.display_name} và ${other.display_name}`);
  }
}
if (migrated) {
  for (const [id, codes] of refById) {
    if (owners.some((o) => o.id === id)) continue;
    for (const c of codes) {
      const hit = owners.find((o) => o.ref_codes.includes(normalizeRefCode(c)));
      if (hit) fail(`Mã "${c}" đã thuộc tài khoản khác (id ${id}) — trùng với ${hit.display_name}`);
    }
  }
}

// ── Hồ sơ ────────────────────────────────────────────────────────────────────
const { data: apps, error: appsErr } = await supabase
  .from("applications")
  .select(`id, full_name, referred_by, created_at${migrated ? ", assignee_user_id" : ""}`)
  .not("referred_by", "is", null)
  .order("created_at", { ascending: true });
if (appsErr) fail(`Lỗi đọc applications: ${appsErr.message}`);

const changes = [];
const summary = new Map(); // ref sau → { count, owner }
for (const a of apps ?? []) {
  const norm = normalizeRefCode(a.referred_by);
  const owner = resolveRefOwner(norm, owners);
  const nextRef = owner ? canonicalRefCode(owner) : norm;
  const nextAssignee = owner ? owner.id : null;
  const s = summary.get(nextRef ?? "(null)") ?? { count: 0, owner: owner?.display_name ?? "—", from: new Set() };
  s.count++;
  s.from.add(a.referred_by);
  summary.set(nextRef ?? "(null)", s);

  const update = {};
  if (nextRef !== a.referred_by) update.referred_by = nextRef;
  // Chỉ giao cho hồ sơ khớp; hồ sơ không khớp giữ nguyên người phụ trách (mặc định null).
  if (owner && (!migrated || a.assignee_user_id !== nextAssignee)) update.assignee_user_id = nextAssignee;
  if (Object.keys(update).length) changes.push({ app: a, update, owner });
}

console.log(`\n== referred_by: trước → sau (${(apps ?? []).length} hồ sơ có ref) ==`);
console.log(`  ${"Mã sau".padEnd(20)} ${"Số HS".padStart(5)}  ${"Người phụ trách".padEnd(26)} Giá trị trước`);
for (const [ref, s] of [...summary.entries()].sort((x, y) => y[1].count - x[1].count)) {
  console.log(`  ${ref.padEnd(20)} ${String(s.count).padStart(5)}  ${s.owner.padEnd(26)} ${[...s.from].map((v) => JSON.stringify(v)).join(", ")}`);
}

console.log(`\n== Hồ sơ sẽ đổi: ${changes.length} ==`);
for (const c of changes) {
  const parts = [];
  if ("referred_by" in c.update) parts.push(`ref ${JSON.stringify(c.app.referred_by)} → ${JSON.stringify(c.update.referred_by)}`);
  if ("assignee_user_id" in c.update) parts.push(`phụ trách → ${c.owner?.display_name ?? "chưa giao"}`);
  console.log(`  ${c.app.id.slice(0, 8)}  ${String(c.app.full_name).slice(0, 30).padEnd(30)} ${parts.join(" · ")}`);
}

if (!APPLY) {
  console.log("\nDry-run — chưa ghi gì. Thêm --apply để ghi (sau khi áp migration).");
  process.exit(0);
}
if (!migrated) fail("\nChưa áp migration 20261028020000_assignee_ref_codes — không ghi được.");

for (const o of owners) {
  const { error } = await supabase.from("hr_users").update({ ref_codes: o.ref_codes }).eq("id", o.id);
  if (error) fail(`Lỗi ghi ref_codes cho ${o.display_name}: ${error.message}`);
}
let done = 0;
for (const c of changes) {
  const { error } = await supabase.from("applications").update(c.update).eq("id", c.app.id);
  if (error) fail(`Lỗi ghi hồ sơ ${c.app.id}: ${error.message} (đã ghi ${done}/${changes.length})`);
  done++;
}
console.log(`\nĐã ghi: ${owners.length} tài khoản, ${done} hồ sơ.`);
