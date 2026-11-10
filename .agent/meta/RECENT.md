# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-11-08 — /hr Copy Link job → /apply/<slug>
- Sếp hỏi sao Copy Link ở tab Jobs ra /careers?job= thay vì /apply/ → đổi có chủ đích từ 66ece81 (2026-10-22, link chia sẻ có preview riêng). Sếp chọn quay lại /apply/<slug>: ứng viên vào thẳng form, ít một bước.
- `JobsView.copyLink` → `/apply/<slug>[?ref=]`. /apply đọc ?ref= (referred_by), preview (og:title/description/image theo job) đã có từ trước — kiểm prod OK. Link chung người giới thiệu (CommissionReferrers, /careers?ref=) giữ nguyên.
- Impact copyLink LOW; tsc/eslint 0.

## 2026-11-10 — Ghi âm PV ngay trong app /hr
- Sếp muốn bấm ghi âm trực tiếp trên hồ sơ ứng viên (PWA iPhone) và lưu luôn. Chốt: PV tại văn phòng ghi bằng mic; PV qua Zalo → gọi trên iPhone, bật loa, ghi bằng /hr trên MÁY THỨ HAI (web app không ghi được cuộc gọi; ghi âm cuộc gọi của iOS không ghi Zalo). Bị ngắt → "Ghi tiếp" nối đoạn, gỡ băng thành 1 transcript.
- Spec `docs/superpowers/specs/2026-11-10-interview-recorder-design.md`, plan `docs/superpowers/plans/2026-11-10-interview-recorder.md`.
- DB: `interview_sessions.audio_pieces jsonb` (migration interview_audio_pieces, chỉ ADD). Mảnh {segment,key,url,bytes,mime,duration_ms,created_at}; vòng cũ audio_url = đoạn 1.
- Server: POST `/api/hr/interviews/[id]/audio-pieces` (cùng luật key/url/vòng khác như PATCH; trùng key → 200; ghi kiểm updated_at). PATCH thay file / Ghi lại + DELETE vòng dọn R2 MỌI mảnh, xoá transcript máy gỡ. `transcribeFromUrls` gửi mọi mảnh trong 1 request Gemini (Whisper: từng mảnh rồi nối), theo thứ tự đoạn.
- Spike Gemini thật: nhận audio/mp4 (cả MP4 phân mảnh như Safari) + audio/webm; 2 mảnh → transcript nối liền.
- Client: `useInterviewRecorder.ts` (MediaRecorder, mảnh 5 phút upload nền, chunk 5s → IndexedDB + RAM, Wake Lock, mức âm, mic bị lấy/track ended/ẩn app → "bị ngắt lúc mm:ss"), `recorder-store.ts` (IndexedDB hr-recorder), `recorder-queue.ts` (singleton, Web Locks giữa tab, thử lại 20s/online), `InterviewRecorder.tsx` (thanh ghi, đoạn, khôi phục, nút đang ghi + "N bản ghi chưa lưu" ở toolbar). Đóng hồ sơ / đăng xuất khi đang ghi → hỏi dừng & lưu. `next.config.ts`: Permissions-Policy microphone=(self) CHỈ cho /hr.
- E2E Chromium (mic giả, next start, DB/R2 prod, hồ sơ ZZTEST + boss tạm — đã xoá hết, R2 404): ghi/dừng, Ghi tiếp, bị ngắt (file giữ chunk cuối 7.22s), khôi phục sau tắt trang (~30s), Ghi lại dọn R2, đổi mảnh 5 phút (300s + 45s, ffprobe OK, ~49kbps), offline → khoá Ghi lại, online tự tải, Esc khi đang ghi hỏi lưu. Phân tích: Gemini gỡ băng đúng; bước chấm local 401 do AI_API_KEY .env.local (VPS có key).
- Review cuối (opus): 0 Critical, 7 Important — đã sửa hết (nhiều tab, IndexedDB hỏng, iOS nền, chunk cuối, race Ghi lại, transcript cũ, đoạn kế tiếp). Tests 446/446, tsc/eslint 0.
- CHƯA thử iPhone thật (iOS nền / mute / Safari MP4 khôi phục) — chờ sếp.
- Minor tồn: timeout init/complete multipart; file R2 mồ côi ở vài ca lỗi; mảnh "mất vòng" của hồ sơ đã xoá chỉ xử lý trong panel; Ghi tiếp trên vòng file tay cũ đồng hồ từ 0:00; Phân tích đang chạy mà gắn thêm mảnh → transcript thiếu đoạn mới; navigator.storage.persist().
