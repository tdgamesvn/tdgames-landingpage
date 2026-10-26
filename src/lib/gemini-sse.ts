/**
 * Đọc phản hồi `streamGenerateContent?alt=sse` của Gemini → ghép text.
 *
 * Vì sao stream: gỡ băng file 40–50 phút, Gemini mất >300s mới trả header nếu gọi
 * generateContent thường — fetch của Node (undici) cắt ở headersTimeout 300s
 * (2026-10-26: "Gỡ băng thất bại" sau 322s). Stream trả header ngay, text về dần.
 */
export function textFromGeminiSse(raw: string): string {
  let text = "";
  for (const line of raw.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    let json: {
      error?: { code?: number; message?: string };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    try {
      json = JSON.parse(payload);
    } catch {
      continue;
    }
    if (json.error) throw new Error(`Gemini lỗi ${json.error.code ?? ""}: ${json.error.message ?? ""}`.trim());
    for (const p of json.candidates?.[0]?.content?.parts ?? []) text += p.text ?? "";
  }
  return text;
}

/** Gemini quá tải/giới hạn (429/500/503) → chờ rồi thử lại: 20s, 40s, 60s. Hết lượt hoặc lỗi khác → null. */
export function geminiRetryDelayMs(status: number, attempt: number): number | null {
  if (![429, 500, 503].includes(status) || attempt > 3) return null;
  return attempt * 20_000;
}
