import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import { AiError } from "@/lib/interview-ai";
import { aiSearch, quickSearch } from "@/lib/candidate-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 100;

/** GET ?q= — tìm nhanh (không tốn token). */
export async function GET(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 200);
  try {
    return NextResponse.json({ results: await quickSearch(getSupabaseAdmin(), q) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Search failed" }, { status: 500 });
  }
}

/** POST {q} — hỏi AI bằng câu tự nhiên. */
export async function POST(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;
  let body: { q?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const q = String(body.q ?? "").trim().slice(0, 500);
  if (q.length < 3) return NextResponse.json({ error: "Câu hỏi quá ngắn" }, { status: 400 });
  try {
    return NextResponse.json({ results: await aiSearch(getSupabaseAdmin(), q) });
  } catch (e) {
    const status = e instanceof AiError ? e.status : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Search failed" }, { status });
  }
}
