import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { redactApplication } from "@/lib/hr-scope";
import { HR_SIGNALS_RULES, aiBackendErrorMessage, extractCvText, hrSignals } from "@/lib/interview-ai";
import { PORTFOLIO_RULES, portfolioPreview } from "@/lib/portfolio-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are a senior recruiter at TD Games Studio, a 2D art / animation / VFX game outsourcing studio in Vietnam.
Evaluate the candidate below against the job description.
If cv_text is provided it is the full text extracted from the candidate's CV — weigh it heavily.
Reply with ONLY a JSON object, no markdown, no prose:
{"score": <0-100 integer>, "verdict": "strong_yes"|"yes"|"maybe"|"no", "strengths": ["..."], "concerns": ["..."], "portfolio_note": "..."}
Keep strengths/concerns to 2-4 short bullet strings each, in Vietnamese.

${HR_SIGNALS_RULES}

${PORTFOLIO_RULES}`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireHrUser(request, "ai.run");
  if ("response" in auth) return auth.response;

  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-5.5";
  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { error: "AI_BASE_URL / AI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const scoped = await loadScopedApplication(auth.ctx, id).catch(() => undefined);
  if (scoped === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!scoped) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: app, error } = await supabase
    .from("applications")
    .select(
      "*, jobs(title, level, type, summary, responsibilities, requirements, nice_to_have, skills)"
    )
    .eq("id", id)
    .single();
  if (error || !app)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { jobs: job, ...a } = app;
  const [cvText, signals, portfolio] = await Promise.all([
    extractCvText(a.cv_url),
    hrSignals(supabase, a),
    portfolioPreview(a),
  ]);
  const userPrompt = JSON.stringify({
    hr_signals: signals,
    portfolio_check: portfolio.links,
    today: new Date().toISOString().slice(0, 10),
    job,
    cv_text: cvText,
    candidate: {
      full_name: a.full_name,
      work_type: a.work_type,
      years_experience: a.years_experience,
      expected_salary: a.expected_salary,
      rate_per_hour: a.rate_per_hour,
      available_from: a.available_from,
      available_hours_per_week: a.available_hours_per_week,
      cv_url: a.cv_url,
      portfolio_url: a.portfolio_url,
      linkedin_url: a.linkedin_url,
      website_url: a.website_url,
      message: a.message,
      referred_by: a.referred_by,
    },
  });

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
          {
            role: "user",
            // Có ảnh portfolio → gửi kèm (detail low: đủ xem sơ bộ, ít token).
            content: portfolio.images.length
              ? [
                  { type: "text", text: userPrompt },
                  ...portfolio.images.map((url) => ({ type: "image_url", image_url: { url, detail: "low" } })),
                ]
              : userPrompt,
          },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    return NextResponse.json(
      { error: "AI backend unreachable (Mac tắt / cliproxyapi không chạy?)" },
      { status: 502 }
    );
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: await aiBackendErrorMessage(res) },
      { status: 502 }
    );
  }

  const completion = await res.json();
  const text: string = completion?.choices?.[0]?.message?.content ?? "";
  // ponytail: naive first-{...} extraction, good enough for "JSON only" prompts
  const match = text.match(/\{[\s\S]*\}/);
  let evaluation: {
    score: number;
    verdict: string;
    strengths: string[];
    concerns: string[];
    portfolio_note?: string;
    portfolio_links?: { url: string; status: string; images_seen: number; videos_found: number; reason?: string }[];
  };
  try {
    const parsed = JSON.parse(match?.[0] ?? "");
    evaluation = {
      score: Math.max(0, Math.min(100, Math.round(Number(parsed.score)))),
      verdict: ["strong_yes", "yes", "maybe", "no"].includes(parsed.verdict)
        ? parsed.verdict
        : "maybe",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns.map(String) : [],
      portfolio_note: parsed.portfolio_note ? String(parsed.portfolio_note).slice(0, 500) : undefined,
      portfolio_links: portfolio.links.map(({ url, status, images_seen, videos_found, reason }) => ({
        url, status, images_seen, videos_found, reason,
      })),
    };
    if (Number.isNaN(evaluation.score)) throw new Error("bad score");
  } catch {
    return NextResponse.json(
      // raw là đầu ra AI → chỉ trả khi có quyền xem AI.
      { error: "AI returned unparseable output", ...(auth.ctx.perms.has("apps.view_ai") ? { raw: text.slice(0, 500) } : {}) },
      { status: 502 }
    );
  }

  // CV unreadable (image-only PDF, too heavy, or non-PDF) — flag it so HR knows the score is form-data-only
  if (a.cv_url && !cvText) {
    evaluation.concerns.unshift(
      "⚠️ Không đọc được nội dung CV (file thuần ảnh / quá nặng / không phải PDF) — điểm chỉ dựa trên form data"
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("applications")
    .update({ ai_score: evaluation.score, ai_evaluation: evaluation })
    .eq("id", id)
    .select()
    .single();
  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Gỡ field thiếu quyền (ai.run không kéo theo apps.view_ai / view_contact…).
  return NextResponse.json({ application: redactApplication(updated, auth.ctx.perms) });
}
