import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { parseKbCard } from "@/lib/chat";
import { chatAiSettings, monthStartVN } from "@/lib/chat-ai";

export const dynamic = "force-dynamic";

const COLS = "id, title, content, audience, sort_order, active, updated_at";

/** Kho kiến thức AI + cài đặt + thống kê tháng — cần chat.manage. */
export async function GET(req: Request) {
  const auth = await requireHrUser(req, "chat.manage");
  if ("response" in auth) return auth.response;
  const db = getSupabaseAdmin();
  const [cards, settings, drafts] = await Promise.all([
    db.from("chat_kb").select(COLS).order("sort_order"),
    chatAiSettings(),
    db.from("chat_ai_drafts").select("status, cost_usd, rating, edited").gte("created_at", monthStartVN().toISOString()).limit(100_000),
  ]);
  if (cards.error) return NextResponse.json({ error: cards.error.message }, { status: 500 });
  const rows = drafts.data ?? [];
  const usage = {
    costUsd: rows.reduce((s, r) => s + Number(r.cost_usd || 0), 0),
    drafts: rows.filter((r) => r.status !== "failed").length,
    failed: rows.filter((r) => r.status === "failed").length,
    sentAsIs: rows.filter((r) => r.status === "sent" && r.edited === false).length,
    sentEdited: rows.filter((r) => r.status === "sent" && r.edited === true).length,
    discarded: rows.filter((r) => r.status === "discarded").length,
    up: rows.filter((r) => r.rating === 1).length,
    down: rows.filter((r) => r.rating === -1).length,
  };
  return NextResponse.json({ cards: cards.data ?? [], settings, usage });
}

export async function POST(req: Request) {
  const auth = await requireHrUser(req, "chat.manage");
  if ("response" in auth) return auth.response;
  const parsed = parseKbCard(await req.json().catch(() => ({})), true);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("chat_kb").insert(parsed.row).select(COLS).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ card: data });
}

/** Cài đặt AI: { mode: "off"|"draft", budgetUsd } */
export async function PUT(req: Request) {
  const auth = await requireHrUser(req, "chat.manage");
  if ("response" in auth) return auth.response;
  const b = (await req.json().catch(() => ({}))) as { mode?: unknown; budgetUsd?: unknown };
  const rows: { key: string; value: string; updated_at: string }[] = [];
  const now = new Date().toISOString();
  if (b.mode !== undefined) {
    if (b.mode !== "off" && b.mode !== "draft") return NextResponse.json({ error: "Chế độ không hợp lệ" }, { status: 400 });
    rows.push({ key: "chat_ai_mode", value: b.mode, updated_at: now });
  }
  if (b.budgetUsd !== undefined) {
    const n = Number(b.budgetUsd);
    if (!Number.isFinite(n) || n < 0 || n > 10000) return NextResponse.json({ error: "Ngân sách 0–10000 USD" }, { status: 400 });
    rows.push({ key: "chat_ai_budget_usd", value: String(n), updated_at: now });
  }
  if (!rows.length) return NextResponse.json({ error: "Không có gì để lưu" }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("app_settings").upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: await chatAiSettings() });
}
