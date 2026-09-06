import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireCRM } from "@/lib/crm-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are a sales rep at TD Games Studio — a 2D art, animation and VFX outsourcing studio for games, based in Hanoi, Vietnam (tdgamestudio.com, tdgames.vn@gmail.com).
Write the reply email to the inbound lead below.
Rules:
- Reply in the SAME language the lead wrote in (English lead → English email).
- Warm but concise: 120-180 words, no fluff, no "I hope this email finds you well".
- Reference concrete details from their message. Never invent prices, headcount, past clients or deadlines.
- Ask at most 2 questions that unblock a quote (scope/volume, art style refs, deadline).
- Close by offering a portfolio link (https://tdgamestudio.com/portfolio) and a call.
- Sign off as "Tuan — TD Games Studio".
- If admin_notes exist they are internal context from our team: use them, never quote them.
Reply with ONLY a JSON object, no markdown:
{"subject": "...", "body": "..."}
body is plain text with \\n line breaks, ready to paste into an email client.`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireCRM(request);
  if (authError) return authError;

  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-5.5";
  if (!baseUrl || !apiKey)
    return NextResponse.json(
      { error: "AI_BASE_URL / AI_API_KEY not configured" },
      { status: 500 },
    );

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: lead, error } = await supabase
    .from("leads")
    .select("name, email, service, budget, message, source, status, admin_notes, created_at")
    .eq("id", id)
    .single();
  if (error || !lead)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(lead) },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    return NextResponse.json(
      { error: "AI backend unreachable (Mac tắt / cliproxyapi không chạy?)" },
      { status: 502 },
    );
  }
  if (!res.ok)
    return NextResponse.json(
      { error: `AI backend error ${res.status}` },
      { status: 502 },
    );

  const completion = await res.json();
  const text: string = completion?.choices?.[0]?.message?.content ?? "";
  // ponytail: naive first-{...} extraction, giống route evaluate bên /hr
  try {
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "");
    const body = String(parsed.body ?? "").trim();
    if (!body) throw new Error("empty body");
    return NextResponse.json({
      subject: String(parsed.subject ?? `Re: ${lead.service} — TD Games Studio`),
      body,
    });
  } catch {
    return NextResponse.json(
      { error: "AI trả về không parse được", raw: text.slice(0, 500) },
      { status: 502 },
    );
  }
}
