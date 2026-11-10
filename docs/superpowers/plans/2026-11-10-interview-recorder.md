# Ghi âm PV trong app /hr — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nút ⏺ Ghi âm trên hồ sơ ứng viên (/hr, ưu tiên iPhone PWA): ghi bằng MediaRecorder, tự cắt mảnh 5 phút upload nền, lưu dự phòng IndexedDB, ghi tiếp nối nhiều đoạn, gỡ băng tất cả đoạn thành 1 transcript.

**Architecture:** Server: cột `audio_pieces jsonb` trên `interview_sessions` (danh sách phẳng mảnh có `segment`), route mới append mảnh, PATCH/DELETE dọn R2 mọi mảnh, transcribe nhận nhiều URL. Client: `recorder-store` (IndexedDB) + `recorder-queue` (singleton upload nền, sống ngoài modal) + hook `useInterviewRecorder` + UI trong `InterviewPanel`. Logic thuần ở `src/lib/interview-audio.ts` (test `node --test`).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (service role), Cloudflare R2, Gemini (gỡ băng), MediaRecorder / IndexedDB / Screen Wake Lock / Web Audio.

**Spec:** `docs/superpowers/specs/2026-11-10-interview-recorder-design.md`

## Global Constraints

- Migration chỉ ADD (không DROP). Áp bằng MCP `apply_migration` + file trong `supabase/migrations/`.
- Mảnh: recorder chốt file mỗi **5 phút**; `timeslice` **5s** lưu IndexedDB; bitrate **48 kbps**.
- Trần mỗi mảnh/đoạn: giữ `AUDIO_MAX_BYTES` 100MB, `AUDIO_TYPE_RE` hiện có.
- Mọi key R2 do server sinh, phải qua `isInterviewAudioKey`; url phải = `r2PublicUrl(key)`; key không thuộc vòng PV khác.
- Chỉ xoá bản IndexedDB sau khi server trả OK cho mảnh đó.
- Nút ghi cần cả `interviews.manage` và `apps.view_interview_analysis`.
- `Permissions-Policy` chỉ mở `microphone=(self)` cho `/hr` và `/hr/:path*`; trang khác giữ `microphone=()`.
- Copy UI tiếng Việt, style `/hr` hiện tại (amber, `hr-theme.css`, các const BTN_*/LABEL trong InterviewPanel).
- Dòng nhắc: "Nhớ báo ứng viên là buổi PV được ghi âm."

## Review Focus

1. Mic bị hệ thống lấy (khoá máy / cuộc gọi đến / chuyển app iOS) → track `ended`/`mute` → phải chốt đoạn + báo "Ghi âm bị ngắt lúc mm:ss", không chạy đồng hồ trên im lặng. (Task 6 test thủ công + unit cho `shouldTreatAsInterrupted`.)
2. Upload mảnh trả lỗi mạng / timeout rồi thử lại → mảnh không bị gắn 2 lần (dedupe theo key, route trả OK nếu key đã có trong chính vòng đó). (Task 1 test `appendPiece` trùng key.)
3. Vòng PV cũ chỉ có `audio_url` + bấm Ghi tiếp → bản cũ thành đoạn 1, mảnh mới đoạn 2, không mất file cũ. (Task 1 test.)
4. Ghi lại / upload file tay / xoá vòng → R2 dọn hết key (cả legacy + mảnh). (Task 1 test `allAudioKeys`.)
5. Đóng modal / tắt app khi đang ghi → không mất phần đã ghi (IDB + queue singleton ngoài modal). (Task 7 thủ công.)

---

### Task 1: Migration + logic thuần cho mảnh

**Files:**
- Create: `supabase/migrations/20261110000000_interview_audio_pieces.sql`
- Modify: `src/lib/interview-audio.ts`, `src/lib/interview-audio.test.ts`, `src/app/admin/_lib/types.ts` (InterviewSession)

**Interfaces — Produces:**
```ts
export type AudioPiece = { segment: number; key: string; url: string; bytes: number; mime: string; duration_ms: number | null; created_at: string };
export type AudioRow = { audio_url?: string | null; audio_key?: string | null; audio_bytes?: number | null; audio_pieces?: AudioPiece[] | null };
export function audioPiecesOf(row: AudioRow): AudioPiece[]           // pieces nếu có; không thì legacy audio_url → 1 mảnh segment 1 (mime "", duration null); không có gì → []
export function allAudioKeys(row: AudioRow): string[]                // mọi key hợp lệ (isInterviewAudioKey), unique
export function nextSegment(pieces: AudioPiece[]): number            // max(segment)+1, rỗng → 1
export function segmentsOf(pieces: AudioPiece[]): { segment: number; pieces: AudioPiece[]; duration_ms: number }[]
export function appendPiece(row: AudioRow & { transcript_source?: string | null }, piece: AudioPiece):
  { duplicate: true } | { duplicate: false; update: { audio_pieces: AudioPiece[]; audio_url: null; audio_key: null; audio_bytes: null; transcript?: null; transcript_source?: null } }
  // Không có cột audio_pieces → seed bằng audio_url legacy. Key đã có → duplicate. transcript_source gemini|whisper → kèm transcript:null.
export const RECORD_PIECE_MS = 5 * 60_000; export const RECORD_TIMESLICE_MS = 5_000; export const RECORD_BITRATE = 48_000;
export function geminiAudioMime(mime: string): string               // bỏ ";codecs=…"; mapping quyết ở Task 3
```

- [ ] **Step 1:** Migration: `ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS audio_pieces jsonb;` + comment cột (mảng `{segment,key,url,bytes,mime,duration_ms,created_at}`, null = dùng audio_url cũ).
- [ ] **Step 2: Test** (thêm vào `interview-audio.test.ts`):
  - `audioPiecesOf` legacy-only → 1 mảnh `{segment:1,key,url,bytes}`; có pieces → trả pieces (bỏ qua legacy); rỗng → `[]`.
  - `appendPiece` vòng legacy → update.audio_pieces = [legacy(seg1), new]; audio_url/key/bytes null.
  - `appendPiece` key trùng → `{duplicate:true}`.
  - `appendPiece` transcript_source "gemini" → `transcript: null`; "manual" → không có key `transcript`.
  - `allAudioKeys` gộp legacy + pieces, lọc key sai định dạng, unique.
  - `segmentsOf` gom [1,1,2] → 2 đoạn, duration cộng (null tính 0), giữ thứ tự created_at.
- [ ] **Step 3:** Chạy `node --test src/lib/interview-audio.test.ts` → FAIL. Implement. Chạy lại → PASS.
- [ ] **Step 4:** Thêm `audio_pieces: AudioPiece[] | null` vào `InterviewSession`. Áp migration qua MCP `apply_migration` (name `interview_audio_pieces`). `npx tsc --noEmit` = 0.
- [ ] **Step 5:** Commit.

### Task 2: Server — append mảnh, dọn R2

**Files:**
- Create: `src/app/api/hr/interviews/[id]/audio-pieces/route.ts`
- Modify: `src/app/api/hr/interviews/[id]/route.ts` (PATCH, DELETE)

**Interfaces — Consumes:** Task 1. **Produces:** `POST /api/hr/interviews/:id/audio-pieces` body `{ key, url, bytes, mime, duration_ms, segment }` → `{ session }` (đã `redactInterview`).

- [ ] **Step 1:** Route POST: `requireHrUser(request, "interviews.manage")` + `loadScopedInterview` (như PATCH). Validate: `isInterviewAudioKey(key)`, `url === r2PublicUrl(key)`, `segment` int ≥1, `bytes` >0 ≤ AUDIO_MAX_BYTES, `mime` khớp AUDIO_TYPE_RE (sau khi bỏ `;…`), `duration_ms` null|≥0. Key thuộc vòng khác (`.neq("id", id)` với `.eq("audio_key", key)` hoặc `.contains("audio_pieces", [{ key }])`) → 400. Đọc dòng → `appendPiece` → duplicate thì trả session hiện tại 200; không thì `update(...)`. Đọc–ghi tuần tự đủ vì client upload mảnh tuần tự (queue).
- [ ] **Step 2:** PATCH: khi set file tay (`audio_key` mới) hoặc clear (`null/null`) → update thêm `audio_pieces: null`; dọn R2 = `allAudioKeys(prev)` trừ key mới (thay cho `oldAudioKey` đơn). Select `prev` lấy cả `audio_pieces`.
- [ ] **Step 3:** DELETE: select `audio_key, audio_url, audio_pieces` → xoá dòng → `deleteFromR2` cho mọi `allAudioKeys(prev)`.
- [ ] **Step 4:** `npx tsc --noEmit`, `npx eslint` các file đổi = 0. Commit.

### Task 3: Gỡ băng nhiều mảnh

**Files:** Modify `src/lib/transcribe.ts`, `src/app/api/hr/interviews/[id]/analyze/route.ts`, `src/lib/interview-audio.ts` (+test `geminiAudioMime`)

**Interfaces — Produces:** `transcribeFromUrls(urls: string[]): Promise<{ text: string; source: TranscriptSource }>`; giữ `transcribeFromUrl(url)` = `transcribeFromUrls([url])`.

- [ ] **Step 1: Spike định dạng (thật, có GEMINI_API_KEY trong .env.local):** tạo 2 file giọng nói ~20s: `say -v Linh -o $TMPDIR/s.aiff "…tiếng Việt…"` → `ffmpeg … -c:a aac $TMPDIR/s.m4a` (MP4/AAC như Safari) và `-c:a libopus $TMPDIR/s.webm` (như Chrome). Script tạm gọi Gemini inline với mime `audio/mp4`, `audio/webm`, và phương án `video/mp4`/`video/webm`, `audio/aac`/`audio/ogg`. Chọn mapping chạy được cho cả hai → khoá vào `geminiAudioMime` + test. Ghi kết quả vào LOG.
- [ ] **Step 2:** `transcribeGemini(parts: {bytes, mimeType, fileName}[])`: tổng > `GEMINI_INLINE_MAX` → mỗi mảnh đi Files API, không thì inline; `contents.parts = [prompt, ...audioParts]`; nhiều mảnh thì thêm vào prompt: "Có N đoạn audio liên tiếp của cùng một buổi PV, theo đúng thứ tự; gỡ băng nối liền, mốc [mm:ss] tính liên tục từ đầu đoạn 1." Whisper: gỡ từng mảnh, nối bằng `\n`. Tải các URL tuần tự.
- [ ] **Step 3:** Analyze: thay `session.audio_url` bằng `audioPiecesOf(session)` (cả check ở dòng ~60 và ~184); gọi `transcribeFromUrls(pieces.map(p => p.url))`.
- [ ] **Step 4:** Chạy lại script spike với 2 mảnh liên tiếp qua `transcribeFromUrls` (URL tạm: upload R2 thử hoặc gọi hàm nội bộ với bytes) → 1 transcript liền. Xoá file thử trên R2 nếu có. tsc/eslint 0. Commit.

### Task 4: Mở mic cho /hr

**Files:** Modify `next.config.ts`

- [ ] **Step 1:** Thêm entry headers sau entry `/:path*`: source `/hr` và `/hr/:path*` với `Permissions-Policy: camera=(), microphone=(self), geolocation=()`; sửa comment dòng 33.
- [ ] **Step 2:** `npm run build && npx next start -p 3012` (hoặc dev) → `curl -sI localhost:3012/hr | grep -i permissions` = `microphone=(self)`; `curl -sI localhost:3012/ | grep -i permissions` = `microphone=()`. Commit.

### Task 5: Kho IndexedDB + hàng đợi upload

**Files:**
- Create: `src/app/hr/_components/recorder-store.ts` (client, IndexedDB `hr-recorder`)
- Create: `src/app/hr/_components/recorder-queue.ts` (singleton)

**Interfaces — Produces:**
```ts
// recorder-store.ts
export type StoredPiece = { id: string; userId: string; appId: string; sessionId: string; segment: number; mime: string; startedAt: number; duration_ms: number | null; state: "recording" | "pending" };
export async function startPiece(meta: Omit<StoredPiece, "state" | "duration_ms">): Promise<void>
export async function appendChunk(pieceId: string, idx: number, blob: Blob): Promise<void>   // store chunks riêng key [pieceId, idx]
export async function finishPiece(pieceId: string, duration_ms: number | null): Promise<void> // state → pending
export async function listPieces(filter?: { userId?: string; appId?: string }): Promise<StoredPiece[]>
export async function pieceBlob(pieceId: string): Promise<Blob>                               // ghép chunk theo idx
export async function removePiece(pieceId: string): Promise<void>
// recorder-queue.ts
export function flushPending(userId: string): Promise<void>   // tuần tự: pending (và "recording" mồ côi khi không có recorder sống) → uploadAudioChunked(File) → POST audio-pieces → removePiece. Chạy 1 lần tại 1 thời điểm (promise chung).
export function subscribeQueue(fn: (s: { pending: number; uploading: string | null; error: string | null }) => void): () => void
export function markLive(pieceId: string | null): void         // mảnh recorder đang ghi — queue không đụng tới
```
- [ ] **Step 1:** Implement store (idb thuần, không thêm thư viện). Phần thuần cần test (đặt tên mảnh `rec-<yyyymmdd-hhmm>-s<seg>.<ext>` từ mime: `audio/mp4`→`m4a`, `audio/webm`→`webm`) → hàm `recordingFileName(mime, startedAt, segment)` trong `interview-audio.ts` + test.
- [ ] **Step 2:** Implement queue: dùng `uploadAudioChunked` (bọc `new File([blob], name, { type: mime })`), POST `/api/hr/interviews/${sessionId}/audio-pieces`; 404 (vòng đã bị xoá) → giữ bản máy, báo lỗi để banner xử lý (Lưu sang vòng khác / Bỏ). Gắn `window.addEventListener("online", …)`; gọi `flushPending` khi HRDashboard mount.
- [ ] **Step 3:** tsc/eslint/test 0. Commit.

### Task 6: Hook ghi âm

**Files:** Create `src/app/hr/_components/useInterviewRecorder.ts`; Modify `src/lib/interview-audio.ts` (+test)

**Interfaces — Consumes:** Task 5. **Produces:**
```ts
export type RecorderStatus = "idle" | "requesting" | "recording" | "paused" | "stopping" | "interrupted" | "denied" | "unsupported";
export function useInterviewRecorder(opts: { userId: string; appId: string }): {
  status: RecorderStatus; elapsedMs: number; level: number /*0..1*/; sessionId: string | null; segment: number | null; interruptedAtMs: number | null; error: string | null;
  start(sessionId: string, segment: number, baseMs: number): Promise<void>; // baseMs = tổng thời lượng các đoạn đã có (từ segmentsOf) pause(): void; resume(): void; stop(): Promise<void>;
}
export function isRecordingActive(): boolean; export function stopActiveRecording(): Promise<void>  // module-level, cho modal/sign-out
// interview-audio.ts (thuần)
export function pickRecorderMime(isSupported: (m: string) => boolean): string | null  // thứ tự: "audio/mp4", "audio/webm;codecs=opus", "audio/webm"; không có → null
export function shouldTreatAsInterrupted(ev: { trackEnded: boolean; mutedForMs: number; recorderError: boolean }): boolean  // ended || error || muted ≥ 3000
```
- [ ] **Step 1: Test** `pickRecorderMime` (Safari chỉ mp4 → mp4; Chrome chỉ webm → `audio/webm;codecs=opus`; không gì → null) và `shouldTreatAsInterrupted` (muted 2999 → false, 3000 → true, ended → true). FAIL → implement → PASS.
- [ ] **Step 2:** Hook: `getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } })`; `NotAllowedError` → `denied`; không có MediaRecorder → `unsupported`. Mỗi mảnh = `new MediaRecorder(stream, { mimeType, audioBitsPerSecond: RECORD_BITRATE })`, `start(RECORD_TIMESLICE_MS)`, `ondataavailable` → `appendChunk`; hẹn `RECORD_PIECE_MS` (tính theo thời gian ghi thật, không tính lúc pause) → stop → `finishPiece` → `flushPending` → mảnh mới cùng stream/segment. Wake Lock request khi ghi, nhả khi dừng, xin lại khi `visibilitychange` visible. Level: AnalyserNode RMS ~10 lần/s. Theo dõi `track.onended`, `onmute/onunmute` (đếm ms), `recorder.onerror`, và khi trang visible lại mà `recorder.state === "inactive"` → `interrupted`: chốt mảnh như stop, `interruptedAtMs = elapsedMs`. `elapsedMs` = `baseMs` + thời gian ghi thật của đoạn hiện tại (không tính lúc pause).
- [ ] **Step 3:** tsc/eslint/test 0. Commit.

### Task 7: UI trong InterviewPanel + guard đóng modal + nhắc toàn cục

**Files:** Modify `src/app/hr/_components/InterviewPanel.tsx`, `src/app/hr/_components/HRDashboard.tsx` (CandidateModal close, header badge, signOut)

- [ ] **Step 1: Header mục Phỏng vấn:** nút `⏺ Ghi âm` (quyền như Global Constraints). Bấm: vòng mới nhất (round lớn nhất) không có `audioPiecesOf().length` và không có `transcript` → ghi vào đó, segment 1; ngược lại `addRound()` rồi ghi vào vòng mới.
- [ ] **Step 2: Thẻ vòng PV, ô "Ghi âm buổi PV":** không có audio → nút ⏺ Ghi âm cạnh ô kéo-thả. Có audio → danh sách đoạn (`segmentsOf`): "Đoạn n · mm:ss" + `<audio>` mỗi mảnh hoặc 1 player tự chuyển mảnh (`onended` → src kế); nút **Ghi tiếp** (segment = `nextSegment`) và **Ghi lại** (confirm "Xoá toàn bộ ghi âm của vòng này và ghi mới?" → PATCH `audio_key:null,audio_url:null` → start segment 1). Upload file tay khi đã có audio → confirm thay thế. Transcript tay (`transcript_source === "manual"`) + có đoạn mới hơn lần dán → dòng cảnh báo "Transcript dán tay chưa gồm đoạn ghi mới".
- [ ] **Step 3: Thanh ghi** (khi hook ≠ idle cho vòng này): chấm đỏ nhấp nháy, đồng hồ `mm:ss`/`h:mm:ss`, vạch level, "Đoạn n", Tạm dừng/Tiếp tục, **Dừng & lưu**, dòng nhắc báo ứng viên, "Đừng khoá màn hình hay chuyển app — iPhone sẽ ngắt ghi âm". `interrupted` → banner "Ghi âm bị ngắt lúc mm:ss — đã lưu phần trước. [Ghi tiếp]". `denied` → hướng dẫn bật mic (iOS: Cài đặt › Safari › Micro; desktop: biểu tượng ổ khoá). Tiến độ queue (`subscribeQueue`): "Đang tải lên mảnh…", lỗi + "Tải lên lại".
- [ ] **Step 4: Khôi phục:** mount → `listPieces({ userId, appId })` không phải mảnh live → banner "Có bản ghi chưa lưu (mm:ss, lúc HH:mm dd/MM) — [Lưu vào vòng PV] [Bỏ]". Lưu = `flushPending`; vòng gốc đã mất → lưu vào vòng mới nhất (tạo nếu chưa có). Bỏ = confirm → `removePiece`.
- [ ] **Step 5: HRDashboard:** CandidateModal — mọi đường đóng (nút ×, Escape, backdrop, sau xoá) qua `guardedClose`: `isRecordingActive()` → `confirm("Đang ghi âm — dừng và lưu?")` → `await stopActiveRecording()` → đóng; huỷ → ở lại. `beforeunload` khi đang ghi. Header: badge "N bản ghi chưa lưu" (subscribeQueue/listPieces theo user) bấm → thử tải lên. `signOut`: còn bản chưa lưu → confirm "Còn N bản ghi chưa lưu trên máy này — vẫn đăng xuất?" (không xoá). Gọi `flushPending(user.id)` khi mount.
- [ ] **Step 6:** tsc/eslint/toàn bộ test HR (`node --test src/lib/*.test.ts`) 0 lỗi. Commit.

### Task 8: Kiểm thử thật + deploy + memory

- [ ] **Step 1:** Dev (`npm run dev -p 3011`, DB prod) + Playwright Chromium (fake mic nếu MCP cho; không thì kiểm UI + luồng upload bằng blob thử qua `browser_evaluate`): tạo vòng trên hồ sơ ZZTEST → ghi ~20s → dừng → đoạn hiện ra, phát được → Ghi tiếp → 2 đoạn → Phân tích ra 1 transcript → Ghi lại → R2 cũ bị xoá (curl URL cũ = 404) → xoá vòng → R2 sạch. Xoá hồ sơ ZZTEST.
- [ ] **Step 2:** `detect_changes` GitNexus; `superpowers:verification-before-completion`; cập nhật `.agent/meta/TASKS.md`, `LOG.md`, `DECISIONS.md` (mảnh 5 phút + jsonb). Push main (CI deploy) → kiểm header prod `curl -sI https://tdgamestudio.com/hr`.
- [ ] **Step 3:** Gửi sếp checklist thử trên iPhone (spec §10).
