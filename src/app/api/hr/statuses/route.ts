import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = ["open", "won", "lost"] as const;

function slugKey(label: string) {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32) || "status";
}

/** Chỉ nhận các field được phép sửa; key/is_system không bao giờ sửa qua API. */
function pickEditable(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (typeof body.label === "string" && body.label.trim()) out.label = body.label.trim().slice(0, 40);
  if (typeof body.color === "string" && /^[a-z]{2,16}$/.test(body.color)) out.color = body.color;
  if (typeof body.position === "number" && Number.isFinite(body.position)) out.position = Math.round(body.position);
  if (typeof body.kind === "string" && (KINDS as readonly string[]).includes(body.kind)) out.kind = body.kind;
  if (body.remind_days === null) out.remind_days = null;
  else if (typeof body.remind_days === "number" && body.remind_days > 0) out.remind_days = Math.round(body.remind_days);
  return out;
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await request.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const { data, error } = await getSupabaseAdmin()
    .from("application_statuses")
    .select("*")
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ statuses: data ?? [] });
}

/** Tạo status mới: { label, color?, kind?, remind_days? } — thêm vào trước cột "lost" cuối. */
export async function POST(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const body = await readJson(request);
  if (!body || typeof body.label !== "string" || !body.label.trim()) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: listErr } = await supabase
    .from("application_statuses")
    .select("key, position, kind");
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

  const keys = new Set((existing ?? []).map((s) => s.key));
  const base = slugKey(body.label);
  let key = base;
  for (let i = 2; keys.has(key); i++) key = `${base}_${i}`;

  // Mặc định chèn trước status "lost" đầu tiên (Rejected luôn nằm cuối).
  const rows = existing ?? [];
  const firstLost = rows.filter((s) => s.kind === "lost").sort((a, b) => a.position - b.position)[0];
  const maxOpen = Math.max(0, ...rows.filter((s) => s.kind !== "lost").map((s) => s.position));
  const position = firstLost && firstLost.position > maxOpen + 1
    ? Math.floor((maxOpen + firstLost.position) / 2)
    : maxOpen + 10;

  const { data, error } = await supabase
    .from("application_statuses")
    .insert([{ key, color: "slate", kind: "open", position, ...pickEditable(body), is_system: false }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ status: data }, { status: 201 });
}

/**
 * Sửa hàng loạt: { statuses: [{ key, label?, color?, position?, kind?, remind_days? }] }
 * Dùng cho đổi tên/màu và kéo đổi thứ tự (gửi lại position cho mọi cột).
 */
export async function PATCH(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const body = await readJson(request);
  const list = Array.isArray(body?.statuses) ? (body!.statuses as Record<string, unknown>[]) : null;
  if (!list || list.length === 0) {
    return NextResponse.json({ error: "statuses[] is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  for (const item of list) {
    if (typeof item.key !== "string") continue;
    const patch = pickEditable(item);
    if (Object.keys(patch).length === 0) continue;
    const { error } = await supabase.from("application_statuses").update(patch).eq("key", item.key);
    if (error) return NextResponse.json({ error: `${item.key}: ${error.message}` }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("application_statuses")
    .select("*")
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ statuses: data ?? [] });
}

/** Xoá: ?key=xxx&move_to=yyy — nếu còn ứng viên trong cột thì bắt buộc move_to. */
export async function DELETE(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const moveTo = url.searchParams.get("move_to");
  if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: row, error: rowErr } = await supabase
    .from("application_statuses")
    .select("key, is_system")
    .eq("key", key)
    .maybeSingle();
  if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.is_system) return NextResponse.json({ error: "Không xoá được status hệ thống" }, { status: 400 });

  const { count, error: countErr } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("status", key);
  if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 });

  if ((count ?? 0) > 0) {
    if (!moveTo || moveTo === key) {
      return NextResponse.json(
        { error: `Còn ${count} ứng viên trong cột này — chọn cột để chuyển sang`, count },
        { status: 409 },
      );
    }
    const { error: moveErr } = await supabase
      .from("applications")
      .update({ status: moveTo })
      .eq("status", key);
    if (moveErr) return NextResponse.json({ error: moveErr.message }, { status: 500 });
  }

  const { error } = await supabase.from("application_statuses").delete().eq("key", key);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: key, moved: count ?? 0 });
}
