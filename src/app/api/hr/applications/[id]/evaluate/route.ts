import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are a senior recruiter at TD Games Studio, a 2D art / animation / VFX game outsourcing studio in Vietnam.
Evaluate the candidate below against the job description.
Reply with ONLY a JSON object, no markdown, no prose:
{"score": <0-100 integer>, "verdict": "strong_yes"|"yes"|"maybe"|"no", "strengths": ["..."], "concerns": ["..."]}
Keep strengths/concerns to 2-4 short bullet strings each, in Vietnamese.`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-5.4-mini";
  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { error: "AI_BASE_URL / AI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

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
  const userPrompt = JSON.stringify({
    job,
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
          { role: "user", content: userPrompt },
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
      { error: `AI backend error ${res.status}` },
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
    };
    if (Number.isNaN(evaluation.score)) throw new Error("bad score");
  } catch {
    return NextResponse.json(
      { error: "AI returned unparseable output", raw: text.slice(0, 500) },
      { status: 502 }
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

  return NextResponse.json({ application: updated });
}
