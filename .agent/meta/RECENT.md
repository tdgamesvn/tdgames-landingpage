# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

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

## 2026-11-10 (tiếp) — Ghi âm PV: dọn việc tồn
- Sếp: "tiếp tục thế nào tốt thì làm" → làm 4 việc tồn có ảnh hưởng dữ liệu/riêng tư:
  - Xoá hồ sơ ứng viên → xoá luôn ghi âm PV mọi vòng trên R2 (trước đây cascade xoá vòng nhưng file nằm lại CDN công khai — lỗi có từ trước). `allSessionsAudioKeys` + test. E2E dev (boss tạm + ZZTEST, đã xoá): CDN 200 trước → DELETE hồ sơ → 404.
  - Phân tích: gỡ băng xong mà ghi âm của vòng đã đổi (có đoạn mới gắn trong lúc chạy) → không lưu transcript thiếu, báo "bấm Phân tích lại". `sameAudio` + test.
  - upload-audio postJson (init/complete multipart) timeout 120s — mạng treo không làm hàng đợi đứng mãi.
  - Bắt đầu ghi → `navigator.storage.persist()` (Safari không tự xoá bản ghi chờ).
- Quét R2 (chỉ đọc): `interviews/` có 9 file, 3 đang dùng, **6 file mồ côi 194MB, đều 2026-10-26** (ngày làm upload ghi âm, nhiều lần thử lại) — CHƯA xoá, chờ sếp quyết.
- Tests 448/448, tsc/eslint 0.
- Sếp OK xoá → đối chiếu LOG 2026-10-26: 6 file mồ côi đều là file THỬ của em hôm đó (t.wav, t.mp3, big.mp3 x2, pv-test.m4a 42MB, pv-test-linh.m4a 12MB) — đã xoá khỏi R2 (404). 3 bản ghi thật của sếp (ba-n-ghi-mo--i-22/24/32) vẫn 200. `interviews/` trên R2 giờ chỉ còn file đang dùng.
