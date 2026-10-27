import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { APP_SELECT, loadHrData, refreshProfile } from "@/lib/candidate-ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Số hồ sơ mỗi request — mỗi hồ sơ có thể tốn ~20s (tải CV + ảnh portfolio + AI). */
const MAX_IDS = 3;

/**
 * Làm mới hồ sơ AI (phần CV/portfolio và/hoặc phần dữ liệu HR) cho vài
 * application. Phần nào còn khớp hash thì bỏ qua → gọi lại nhiều lần vô hại.
 */
export async function POST(request: Request) {
  const auth = await requireHrUser(request, "ai.run");
  if ("response" in auth) return auth.response;

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  let ids = Array.isArray(body.ids) ? body.ids.map(String).slice(0, MAX_IDS) : [];
  if (!ids.length) return NextResponse.json({ error: "ids required" }, { status: 400 });

  // Chỉ làm hồ sơ trong phạm vi của người gọi (id ngoài phạm vi bị bỏ lặng lẽ như không tồn tại).
  if (auth.ctx.role !== "boss" && auth.ctx.role !== "hr") {
    const checked = await Promise.all(ids.map((i) => loadScopedApplication(auth.ctx, i).then((a) => (a ? i : null)).catch(() => undefined)));
    if (checked.includes(undefined)) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
    ids = checked.filter((i): i is string => !!i);
    if (!ids.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data: apps, error } = await supabase.from("applications").select(APP_SELECT).in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const hr = await loadHrData(supabase, ids);

  const results = await Promise.all(
    ((apps ?? []) as unknown as Record<string, unknown>[]).map(async (a) => {
      try {
        const r = await refreshProfile(supabase, a, hr.get(String(a.id))!);
        return { id: a.id, ok: true, ...r };
      } catch (e) {
        return { id: a.id, ok: false, error: e instanceof Error ? e.message : "failed" };
      }
    }),
  );
  return NextResponse.json({ results });
}
