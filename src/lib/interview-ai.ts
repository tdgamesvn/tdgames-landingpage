import "server-only";

/**
 * Tầng AI dùng chung cho tuyển dụng: chấm hồ sơ (evaluate), sinh câu hỏi PV
 * (questions) và phân tích sau PV (analyze).
 *
 * Cả 3 đều gọi cùng một backend OpenAI-compatible (cliproxyapi trên Mac qua
 * tailscale) và đều bắt model trả JSON thuần.
 */

/** Lỗi có sẵn HTTP status để route map thẳng ra response. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly status = 502,
    readonly raw?: string,
  ) {
    super(message);
    this.name = "AiError";
  }
}

export function getAiConfig() {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-5.5";
  if (!baseUrl || !apiKey) {
    throw new AiError("AI_BASE_URL / AI_API_KEY not configured", 500);
  }
  return { baseUrl, apiKey, model };
}

/**
 * Gọi chat/completions và parse JSON từ câu trả lời.
 *
 * ponytail: vẫn dùng cách bóc `{...}` đầu tiên như route evaluate cũ thay vì
 * response_format:json_object — cliproxyapi đẩy thẳng lên tài khoản Codex,
 * không phải endpoint nào cũng nhận tham số đó.
 */
export async function callAiJson<T>(
  systemPrompt: string,
  userPrompt: string,
  opts: { timeoutMs?: number } = {},
): Promise<{ data: T; model: string }> {
  const { baseUrl, apiKey, model } = getAiConfig();

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 90_000),
    });
  } catch {
    throw new AiError("AI backend unreachable (Mac tắt / cliproxyapi không chạy?)");
  }

  if (!res.ok) throw new AiError(`AI backend error ${res.status}`);

  const completion = await res.json();
  const text: string = completion?.choices?.[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new AiError("AI returned unparseable output", 502, text.slice(0, 500));
  }
  try {
    return { data: JSON.parse(match[0]) as T, model };
  } catch {
    throw new AiError("AI returned unparseable output", 502, text.slice(0, 500));
  }
}

/** Tải CV về và bóc text (chỉ PDF). Trả null nếu hỏng — caller tự quyết. */
export async function extractCvText(cvUrl: string | null): Promise<string | null> {
  if (!cvUrl) return null;
  try {
    const res = await fetch(cvUrl, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    if (Number(res.headers.get("content-length") ?? 0) > 20 * 1024 * 1024) return null; // skip >20MB
    const isPdf =
      cvUrl.toLowerCase().includes(".pdf") ||
      (res.headers.get("content-type") ?? "").includes("pdf");
    if (!isPdf) return null; // ponytail: PDF only — docx/images can come later if HR needs it
    const { extractText } = await import("unpdf");
    const { text } = await extractText(new Uint8Array(await res.arrayBuffer()), {
      mergePages: true,
    });
    const merged = (Array.isArray(text) ? text.join("\n") : text).trim();
    return merged ? merged.slice(0, 12_000) : null; // cap prompt size
  } catch {
    return null; // CV unreadable — evaluate from form data only
  }
}

/** Các trường ứng viên đem cho AI. Dùng chung để 3 route nhìn cùng một bức tranh. */
export function candidateFacts(a: Record<string, unknown>) {
  return {
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
  };
}

export const JOB_SELECT =
  "jobs(title, level, type, summary, responsibilities, requirements, nice_to_have, skills)";

export const STUDIO_CONTEXT =
  "TD Games Studio — studio outsourcing 2D art / animation / VFX cho game tại Việt Nam.";

export function clampScore(v: unknown): number {
  const n = Math.round(Number(v));
  if (Number.isNaN(n)) throw new AiError("AI returned a non-numeric score");
  return Math.max(0, Math.min(100, n));
}

export function asStringArray(v: unknown, cap = 12): string[] {
  return Array.isArray(v) ? v.slice(0, cap).map(String) : [];
}
