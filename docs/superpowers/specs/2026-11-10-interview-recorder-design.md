# Ghi âm PV trực tiếp trong app /hr — thiết kế

Ngày: 2026-11-10 · Người yêu cầu: sếp (Tony) · Trạng thái: chờ sếp duyệt

## 1. Vì sao

Hiện tại ghi âm buổi PV phải làm bằng app khác (Voice Memos…), xong mới vào /hr kéo file
vào vòng PV (`InterviewPanel.tsx` — ô "Ghi âm buổi PV", upload chia phần 5MB qua
`/api/hr/upload/audio/multipart`, rồi bấm Phân tích → Gemini gỡ băng + AI chấm).

Sếp muốn: **dùng app PWA /hr trên điện thoại như app ghi âm** — mở hồ sơ ứng viên, bấm ghi,
bấm dừng là bản ghi nằm luôn trong vòng PV, không qua app/file trung gian.

## 2. Bối cảnh dùng (sếp nói)

- Chủ yếu trên **iPhone**, app /hr đã cài lên màn hình chính (PWA). Đôi khi laptop.
- Hai kiểu PV:
  - **Tại văn phòng** (mode `offline` trong hệ thống): điện thoại đặt trên bàn, ghi bằng mic.
  - **Gọi Zalo**: gọi trên iPhone bật loa ngoài, **ghi bằng /hr trên máy thứ hai**
    (laptop hoặc điện thoại khác). Sếp đã chấp nhận cách này.
- Sếp chọn: bị ngắt giữa chừng thì **ghi tiếp nối vào cùng vòng**, các đoạn gộp thành 1 buổi.

## 3. Mục tiêu

1. Nút **⏺ Ghi âm** trên hồ sơ ứng viên (mục "Phỏng vấn"), dùng được trên iPhone PWA,
   Android Chrome, Chrome/Safari desktop.
2. Màn ghi kiểu app ghi âm: đồng hồ chạy, mức âm (biết mic đang thu), Tạm dừng / Tiếp tục,
   Dừng & lưu.
3. Bấm Dừng → bản ghi tự upload và gắn vào vòng PV; Phân tích chạy như cũ.
4. **Không mất bản ghi**: trong lúc ghi lưu dần xuống máy (IndexedDB) vài giây/lần. Đóng app,
   app crash, mất mạng → mở lại hồ sơ thấy "Có bản ghi chưa lưu — Khôi phục / Bỏ".
   Mất mạng lúc bấm Dừng → bản ghi nằm chờ trong máy, có mạng thì tự (hoặc bấm) tải lên.
5. **Ghi tiếp nối**: ghi bị ngắt (khoá màn hình, chuyển app, cuộc gọi đến, lỡ bấm Dừng) →
   trên vòng PV hiện "Ghi tiếp" — đoạn mới nối vào sau. Một vòng PV = danh sách đoạn có thứ tự.
   Phát lại: nghe lần lượt các đoạn. Gỡ băng: tất cả đoạn theo thứ tự thành **1 transcript liền**.

## 4. Không làm (non-goals)

- **Ghi cuộc gọi trên chính máy đang gọi** (Zalo/gọi thường): web app không lấy được mic/âm
  cuộc gọi trên iOS/Android — giới hạn hệ điều hành. Dùng máy thứ hai.
- Ghi khi màn hình khoá / app chạy nền trên iPhone: iOS không cho. Chỉ giữ màn hình sáng
  (Wake Lock) và báo rõ khi bị ngắt.
- Mở app khi **chưa có mạng**: service worker /hr không cache trang (cố ý, `public/hr-sw.js`).
  App phải mở được (có mạng) trước khi ghi; mất mạng *trong lúc* ghi thì vẫn ổn.
- Ghi âm tab Meet/Zoom (getDisplayMedia) — không cần, sếp PV online qua Zalo.
- Cắt/ghép/sửa audio, chọn đoạn để xoá lẻ.

## 5. Chống mục tiêu (làm vậy là hỏng dù "chạy được")

- Mất bản ghi của 1 buổi PV mà không báo — tệ nhất. Mọi đường lỗi phải để lại bản trong máy
  hoặc báo rõ.
- Ghi âm im lặng 40 phút mà UI vẫn chạy đồng hồ như bình thường (mic bị hệ thống lấy mất,
  track `muted`/`ended`) — phải phát hiện và báo "Đã ngắt ghi âm".
- Phá luồng cũ: upload file tay, phân tích, xoá vòng PV (dọn file R2) phải chạy y như trước
  cho các vòng PV đang có.

## 6. Ràng buộc kỹ thuật đã biết

- **`next.config.ts` đang chặn mic toàn site**: `Permissions-Policy: microphone=()`.
  Phải mở `microphone=(self)` — tối thiểu cho `/hr` (giữ `()` cho trang public là tốt nhất).
  Không mở là `getUserMedia` bị từ chối ngay, không hiện hộp xin quyền.
- Định dạng MediaRecorder: iOS Safari → `audio/mp4` (AAC); Chrome/Android → `audio/webm;codecs=opus`.
  Cả hai đã qua `AUDIO_TYPE_RE` (`src/lib/interview-audio.ts`). Bitrate ~48 kbps → 3 tiếng ≈ 65MB,
  dưới trần 100MB/đoạn hiện có.
- **Phải kiểm sớm (spike đầu tiên)**: Gemini (`transcribe.ts`) có nhận `audio/mp4` từ Safari và
  `audio/webm` từ Chrome không, content-type R2 trả về là gì. Nếu không nhận → đổi mime khi gửi
  (vd `video/mp4`/`video/webm`, hoặc `audio/aac`/`audio/ogg`) — builder tự tìm cách chạy được.
- **Phải kiểm sớm**: các chunk `ondataavailable` (timeslice) của *một* lần ghi khi nối lại có ra
  file phát được không — đặc biệt khi chỉ có phần đầu (app crash giữa chừng) với MP4 của Safari.
  Đây là cơ sở của khôi phục. Nếu Safari không cho phần đầu phát được → mỗi đoạn tự cắt thành
  đoạn con ngắn (vd stop/start recorder mỗi N phút) để khi crash chỉ mất tối đa N phút; ghi rõ
  lựa chọn trong plan.
  **Đã chốt (Claude): KHÔNG chờ spike, làm cách an toàn ngay từ đầu** — xem "mảnh" ở §8.
  Spike trên iPhone chỉ còn để biết có cứu thêm được phần dở của mảnh đang ghi khi crash hay
  không (kiểm trên prod sau deploy, không chặn việc build).
- Các đoạn khác nhau là các file riêng (không nối nhị phân file webm/mp4 khác lần ghi).
- Quyền: chỉ người có `interviews.manage` thấy nút ghi (như upload hiện tại).
- Wake Lock: `navigator.wakeLock` — có trên iOS PWA bản mới; không có thì bỏ qua, vẫn hiện
  cảnh báo "Đừng khoá màn hình".

## 7. Hành vi chi tiết

### 7.1 Vào ghi
- Ở header mục "Phỏng vấn" (cạnh "+ Đặt lịch PV"): nút **⏺ Ghi âm**.
  - Chưa có vòng PV → bấm là tạo vòng PV mới (POST hiện có, không đặt lịch, không báo
    Discord/push) rồi ghi vào vòng đó. *(quyết định của Claude)*
  - Vòng mới nhất **chưa có ghi âm và chưa có transcript** → ghi vào vòng đó (trường hợp đã
    đặt lịch trước). Vòng mới nhất đã có ghi âm/transcript → **tạo vòng mới** rồi ghi — không
    bao giờ để nút ở header nối vào buổi PV cũ / xoá transcript cũ. *(quyết định của Claude)*
  - Nối tiếp buổi đang dở = bấm **Ghi tiếp** trong thẻ vòng PV đó (chủ động, xem 7.4).
- Trong thẻ vòng PV, ô "Ghi âm buổi PV": thêm nút ⏺ Ghi âm cạnh ô kéo-thả file (file tay vẫn
  dùng được).
- Lần đầu: trình duyệt xin quyền mic. Bị từ chối → hướng dẫn bật lại (iOS: Cài đặt → Safari →
  Micro / hoặc aA trong app).
- Dòng nhắc nhỏ: "Nhớ báo ứng viên là buổi PV được ghi âm." *(quyết định của Claude)*

### 7.2 Đang ghi
- Thanh ghi nổi rõ: chấm đỏ nhấp nháy, đồng hồ (tổng thời lượng cả các đoạn), vạch mức âm,
  Tạm dừng/Tiếp tục, **Dừng & lưu**. Hiện cả "Đoạn 2" nếu đang ghi tiếp.
- Wake Lock bật khi ghi, nhả khi dừng.
- Đóng modal hồ sơ / rời trang khi đang ghi → hỏi xác nhận "Đang ghi âm — dừng và lưu?".
  *(quyết định của Claude — không làm thanh ghi chạy xuyên trang)*
- Bị ngắt (track `ended`/`mute` kéo dài, recorder `error`, trang bị ẩn trên iOS rồi quay lại
  mà recorder đã chết) → tự chốt đoạn hiện tại như bấm Dừng, báo "Ghi âm bị ngắt lúc mm:ss —
  đã lưu phần trước. Bấm Ghi tiếp để nối."

### 7.3 Dừng & lưu
- Các mảnh đã upload ở nền trong lúc ghi (§8); Dừng → chốt và upload mảnh cuối (tiến độ %,
  thử lại khi kẹt — tái dùng logic thử lại của `upload-audio.ts`).
- Mỗi mảnh upload xong → gắn vào vòng PV ở server → xoá mảnh đó trong IndexedDB. **Chỉ xoá
  bản máy sau khi server xác nhận đã lưu.**
- Upload lỗi / không mạng → giữ trong máy, hiện "1 đoạn chưa tải lên — Tải lên lại", và tự thử
  lại khi có mạng (`online` event) / khi mở lại hồ sơ.

### 7.4 Vòng PV có nhiều đoạn
- Ô ghi âm hiện danh sách: "Đoạn 1 · 23:10", "Đoạn 2 · 18:42"… mỗi đoạn 1 trình phát (hoặc 1
  trình phát tự chuyển đoạn — builder chọn). Nút **Ghi tiếp** + **Ghi lại** (hỏi xác nhận, xoá
  hết các đoạn cũ kể cả file R2, rồi ghi mới).
- Upload file tay giữ đúng nghĩa cũ: **thay thế** ghi âm của vòng (nếu đã có đoạn nào → hỏi
  xác nhận, xoá hết file R2 cũ), file đó thành đoạn duy nhất. *(quyết định của Claude)*
  Vòng PV cũ có `audio_url` = coi như 1 đoạn.
- Thêm/xoá đoạn khi đã có transcript máy gỡ (`transcript_source` ≠ `manual`) → xoá transcript
  máy để lần Phân tích sau gỡ lại đủ các đoạn; transcript dán tay giữ nguyên, hiện cảnh báo
  "transcript chưa gồm đoạn mới". *(quyết định của Claude)*

### 7.5 Khôi phục
- Mở hồ sơ (hoặc mở app) mà IndexedDB còn bản ghi chưa lưu của vòng PV thuộc hồ sơ này →
  banner "Có bản ghi chưa lưu (12:30, lúc 14:05 hôm nay) — Lưu vào vòng PV / Bỏ".
  Lưu = upload như 7.3 thành 1 đoạn. Bỏ = hỏi xác nhận rồi xoá.
- Nên có thêm 1 chỗ chung (vd header /hr) báo "Có N bản ghi chưa lưu" để không bị quên khi
  không mở đúng hồ sơ. *(quyết định của Claude)*
- Máy dùng chung (laptop ghi Zalo): bản trong máy gắn id tài khoản HR đã ghi; chỉ hiện banner
  cho đúng tài khoản đó. **Đăng xuất không tự xoá** (mất bản ghi tệ hơn) — chỉ cảnh báo
  "Còn N bản ghi chưa lưu trên máy này" trước khi đăng xuất. *(quyết định của Claude)*

### 7.6 Ai thấy nút ghi
- Cần cả `interviews.manage` **và** `apps.view_interview_analysis` (người thiếu quyền xem thì
  server `redactInterview` giấu hết audio → không thấy được đoạn đã ghi / Ghi tiếp).
  *(quyết định của Claude)*

## 8. Dữ liệu & server

- **Mảnh (piece) — quyết định của Claude**: trong lúc ghi, recorder tự chốt file mỗi ~5 phút
  (stop/start trên cùng stream mic) thành 1 mảnh và **upload mảnh đó ngay ở nền** trong khi
  vẫn ghi tiếp. Lợi: app crash chỉ mất tối đa phần dở của mảnh hiện tại (đang lưu IndexedDB,
  cứu được nếu định dạng cho phép); bấm Dừng gần như lưu xong ngay; không phụ thuộc
  "phần đầu file MP4 có phát được không". Mảnh nhỏ (~2MB) → đi route upload thường, không cần
  multipart. Chấp nhận khe hở rất ngắn giữa 2 mảnh.
- Người dùng chỉ thấy **đoạn** (= giữa 2 lần bị ngắt / bấm Dừng); mảnh là chi tiết nội bộ.
  Dữ liệu: **một danh sách phẳng các mảnh** có thứ tự, mỗi mảnh mang số đoạn — {segment,
  key R2, url, bytes, mime, thời lượng, created_at}. UI gom theo `segment`.
- Cách lưu (cột jsonb trên `interview_sessions` hay bảng riêng) để
  plan quyết, miễn:
  - vòng PV cũ (chỉ có `audio_url/audio_key/audio_bytes`) vẫn hiện/phân tích/xoá đúng;
  - giữ đủ các kiểm tra an toàn đang có ở PATCH: key do server sinh (`isInterviewAudioKey`),
    url = `r2PublicUrl(key)`, key không thuộc vòng khác;
  - xoá vòng PV / Ghi lại → xoá **mọi** file R2 của các đoạn.
- Migration chỉ THÊM (không DROP — DROP từ Telegram không chạy được qua MCP).
- `transcribe.ts`: Gemini — gửi tất cả đoạn theo thứ tự trong **một** request (nhiều
  `file_data`/`inline_data` part + câu nhắc "đây là các đoạn liên tiếp của cùng 1 buổi; mốc
  [mm:ss] tính liên tục"). Whisper — gỡ từng đoạn rồi nối. Analyze route đọc danh sách đoạn
  thay vì chỉ `audio_url`.
- Kiểm tra trần: mỗi đoạn ≤100MB như hiện tại; tổng các đoạn đi Gemini Files API như file lớn.

## 9. Để builder quyết

Cấu trúc component/hook (vd `useRecorder`), timeslice cụ thể (gợi ý 5s), cách lưu IndexedDB,
UI chi tiết thanh ghi (theo style /hr hiện tại: `hr-theme.css`, nút amber), 1 hay nhiều trình
phát, bảng hay cột jsonb.

## 10. Kiểm thử tối thiểu

- Test đơn vị cho phần logic thuần (gộp đoạn, tính thời lượng, xác thực đoạn ở server, quyết
  định xoá transcript).
- E2E thật trên **iPhone PWA** (sếp hoặc em qua prod sau deploy): ghi 1 phút → dừng → nghe lại
  → Phân tích ra transcript; ghi → khoá máy → mở lại → Ghi tiếp → Phân tích ra 1 transcript
  liền; ghi → tắt hẳn app → mở lại → Khôi phục; ghi khi tắt wifi/4G → bật lại → tự tải lên.
- Chrome desktop: ghi + phân tích (webm).
- Vòng PV cũ có file upload tay: vẫn phát + phân tích + xoá đúng.
