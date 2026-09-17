import "server-only";

/**
 * mp3 ghi âm PV → text.
 *
 * QUAN TRỌNG: backend AI hiện tại (cliproxyapi, AI_BASE_URL) KHÔNG làm được
 * audio — `/v1/audio/transcriptions` trả 404 và chat/completions trả
 * "Audio input is not available.". Nên transcribe phải đi nhà cung cấp riêng.
 *
 * Cắm key nào chạy key đó, theo thứ tự ưu tiên:
 *   1. GEMINI_API_KEY  → Gemini (nhận audio native, tiếng Việt tốt, file lớn OK)
 *   2. OPENAI_API_KEY  → Whisper (trần 25MB)
 *   3. không key       → null, HR tự dán transcript tay (UI vẫn chạy bình thường)
 */

export type TranscriptSource = "gemini" | "whisper" | "manual";

export class TranscribeError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "TranscribeError";
  }
}

export function transcriptionProvider(): "gemini" | "whisper" | null {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "whisper";
  return null;
}

const TRANSCRIBE_PROMPT = `Gỡ băng toàn bộ đoạn ghi âm phỏng vấn tuyển dụng này thành văn bản.
Giữ nguyên ngôn ngữ gốc (thường là tiếng Việt, có thể xen thuật ngữ tiếng Anh) — KHÔNG dịch.
Phân biệt người nói bằng nhãn "Người phỏng vấn:" và "Ứng viên:".
Mỗi lượt nói xuống dòng mới, mở đầu bằng mốc thời gian dạng [mm:ss].
Nếu có đoạn nghe không rõ, ghi [không nghe rõ] thay vì đoán.
Chỉ trả về transcript, không thêm lời dẫn hay tóm tắt.`;

// ── Gemini ───────────────────────────────────────────────────────────────────

const GEMINI_BASE = "https://generativelanguage.googleapis.com";
/** Trên ngưỡng này phải đi Files API — inline base64 làm phình request quá giới hạn. */
const GEMINI_INLINE_MAX = 18 * 1024 * 1024;

/**
 * KHÔNG hạ về gemini-2.5-flash: Google đã khoá model đó với key tạo mới
 * ("no longer available to new users" → 404), dù nó VẪN xuất hiện trong
 * `GET /v1beta/models`. Danh sách models không phải bằng chứng model dùng được.
 */
function geminiModel() {
  return process.env.GEMINI_TRANSCRIBE_MODEL ?? "gemini-3.6-flash";
}

/**
 * Upload resumable lên Gemini Files API, đợi file sang trạng thái ACTIVE.
 * Trả về file_uri để nhét vào generateContent.
 */
async function geminiUpload(
  key: string,
  bytes: Buffer,
  mimeType: string,
  displayName: string,
): Promise<string> {
  const startRes = await fetch(`${GEMINI_BASE}/upload/v1beta/files?key=${key}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.length),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "content-type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!startRes.ok) {
    throw new TranscribeError(`Gemini upload start lỗi ${startRes.status}`);
  }
  const uploadUrl = startRes.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new TranscribeError("Gemini không trả upload URL");

  const upRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Command": "upload, finalize",
      "X-Goog-Upload-Offset": "0",
      "content-length": String(bytes.length),
    },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(600_000),
  });
  if (!upRes.ok) throw new TranscribeError(`Gemini upload lỗi ${upRes.status}`);

  const uploaded = await upRes.json();
  const fileUri: string | undefined = uploaded?.file?.uri;
  const fileName: string | undefined = uploaded?.file?.name;
  if (!fileUri || !fileName) throw new TranscribeError("Gemini upload không trả file uri");

  // File vừa upload ở trạng thái PROCESSING — generateContent sẽ lỗi nếu gọi sớm.
  let state: string = uploaded?.file?.state ?? "PROCESSING";
  for (let i = 0; state === "PROCESSING" && i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(`${GEMINI_BASE}/v1beta/${fileName}?key=${key}`, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!poll.ok) break;
    state = (await poll.json())?.state ?? state;
  }
  if (state === "FAILED") throw new TranscribeError("Gemini xử lý file audio thất bại");

  return fileUri;
}

async function transcribeGemini(
  bytes: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const key = process.env.GEMINI_API_KEY!;

  const audioPart =
    bytes.length > GEMINI_INLINE_MAX
      ? { file_data: { mime_type: mimeType, file_uri: await geminiUpload(key, bytes, mimeType, fileName) } }
      : { inline_data: { mime_type: mimeType, data: bytes.toString("base64") } };

  const res = await fetch(
    `${GEMINI_BASE}/v1beta/models/${geminiModel()}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: TRANSCRIBE_PROMPT }, audioPart] }],
        generationConfig: { temperature: 0 },
      }),
      signal: AbortSignal.timeout(900_000),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new TranscribeError(`Gemini lỗi ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  const parts: Array<{ text?: string }> = json?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new TranscribeError("Gemini trả transcript rỗng");
  return text;
}

// ── Whisper ──────────────────────────────────────────────────────────────────

const WHISPER_MAX = 25 * 1024 * 1024;

async function transcribeWhisper(
  bytes: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  if (bytes.length > WHISPER_MAX) {
    throw new TranscribeError(
      `File ${(bytes.length / 1024 / 1024).toFixed(1)}MB vượt trần 25MB của Whisper — nén mp3 xuống bitrate thấp hơn, hoặc cắm GEMINI_API_KEY để dùng Gemini.`,
      400,
    );
  }

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mimeType }), fileName);
  form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL ?? "whisper-1");
  form.append("language", "vi");
  form.append("prompt", "Phỏng vấn tuyển dụng tại studio game 2D art/animation/VFX.");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(900_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new TranscribeError(`Whisper lỗi ${res.status}: ${body.slice(0, 200)}`);
  }
  const text = ((await res.json())?.text ?? "").trim();
  if (!text) throw new TranscribeError("Whisper trả transcript rỗng");
  return text;
}

// ── Public ───────────────────────────────────────────────────────────────────

/**
 * Tải audio từ R2 rồi gỡ băng. Ném TranscribeError nếu chưa cấu hình provider
 * — caller nên bắt và bảo HR dán transcript tay.
 */
export async function transcribeFromUrl(
  url: string,
): Promise<{ text: string; source: TranscriptSource }> {
  const provider = transcriptionProvider();
  if (!provider) {
    throw new TranscribeError(
      "Chưa cấu hình dịch vụ gỡ băng (thiếu GEMINI_API_KEY hoặc OPENAI_API_KEY). Dán transcript tay vào ô bên dưới rồi bấm Phân tích.",
      501,
    );
  }

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(300_000) });
  } catch {
    throw new TranscribeError("Không tải được file ghi âm từ CDN");
  }
  if (!res.ok) throw new TranscribeError(`Không tải được file ghi âm (${res.status})`);

  const bytes = Buffer.from(await res.arrayBuffer());
  if (!bytes.length) throw new TranscribeError("File ghi âm rỗng");

  const mimeType = res.headers.get("content-type")?.split(";")[0] || "audio/mpeg";
  const fileName = url.split("/").pop() || "interview.mp3";

  const text =
    provider === "gemini"
      ? await transcribeGemini(bytes, mimeType, fileName)
      : await transcribeWhisper(bytes, mimeType, fileName);

  return { text, source: provider };
}
