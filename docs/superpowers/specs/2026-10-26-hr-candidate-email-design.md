# HR: gửi mail cho ứng viên từ /hr — Design

Ngày: 2026-10-26 · Người yêu cầu: sếp (tony@tdgamestudio.com)

## Vì sao

Hiện HR tự soạn mail trong Gmail cho từng ứng viên (mời PV, gửi link bài test, báo
trượt), còn link test thì bấm "Copy link test" rồi dán tay. Mục tiêu: gửi ngay trong
hồ sơ ở `/hr`, nội dung điền sẵn từ dữ liệu có trong DB, có lưu vết.

Resend đã sẵn sàng: domain `tdgamestudio.com` verified, gửi thử từ
`hr@tdgamestudio.com` → tony@ đã delivered (2026-10-26).

## Mục tiêu

- Người gửi: `TD Games HR <hr@tdgamestudio.com>` qua Resend API.
- 5 loại mail, **tiếng Việt** (sếp chốt):
  1. `interview_invite` — mời phỏng vấn
  2. `interview_reschedule` — đổi lịch PV *(em thêm)*
  3. `test_assignment` — gửi bài test
  4. `rejection` — báo trượt
  5. `interview_cancel` — huỷ lịch PV (sếp duyệt 2026-10-26)
- **Không bao giờ tự gửi.** Mọi lần gửi đều qua hộp thoại, HR đọc → (sửa) → bấm Gửi
  hoặc Không gửi (sếp chốt).
- **Chế độ test là mặc định** (sếp chốt: "chưa bật gửi cho ứng viên, cần test đã").

## Không làm (non-goals)

- Không nhận mail trả lời / inbox trong /hr. Reply-To để HR nhận ở hộp thư thật.
- Không tự gửi theo cron, không gửi hàng loạt.
- Không chỉnh mẫu mail qua UI admin (mẫu nằm trong code; sửa từng lần trong hộp thoại).
- Không đụng outreach (`td-mailer-api`) hay `notify-email` bên tdgames-platforms.

## Anti-goals (coi là hỏng dù chạy được)

- Một mail lọt tới ứng viên thật khi đang ở chế độ test.
- Mail báo trượt lộ `rejection_reason` / ghi chú nội bộ / điểm AI.
- Bấm "Không gửi" mà trạng thái / lịch PV không được lưu.
- API key Resend lộ ra client.

## Hành vi

### Khi nào hộp thoại hiện

Hộp thoại chỉ hiện **sau khi** thao tác gốc đã lưu thành công (PATCH OK):

| Thao tác | Mail đề xuất |
|---|---|
| Chuyển status sang `test` (mọi đường: kéo thả Pipeline, dropdown, QuickAction, modal hồ sơ) | `test_assignment` |
| Chuyển status sang `rejected` (mọi đường) | `rejection` |
| Lưu lịch PV lần đầu cho 1 vòng (scheduled_at từ null → có) | `interview_invite` |
| Sửa giờ / hình thức / link Meet của vòng đã có lịch | `interview_reschedule` |
| Bấm "Huỷ lịch" của vòng đã có lịch (PATCH `scheduled_at: null`) | `interview_cancel` |

- `test_assignment` khi job chưa có đề test: không hiện hộp thoại, hiện thông báo nhỏ
  "Job chưa có đề test — chưa gửi mail". Link test lấy/ tạo bằng logic sẵn có ở
  `POST /api/hr/applications/[id]/submissions` (`test_token`).
- Ứng viên không có email hợp lệ: hộp thoại báo lỗi, nút Gửi bị khoá.
- Status được định nghĩa động (`application_statuses`); trigger theo `key` `test`
  và `rejected` (key không đổi tên được qua API). `rejected` là status hệ thống;
  `test` thì HR xoá được — nếu bị xoá thì không còn tự hiện hộp thoại bài test,
  vẫn gửi được bằng nút "Gửi mail". *(em chọn: không thêm migration khoá `test`.)*
- Chỉ các thao tác trong UI `/hr` mới hiện hộp thoại. Tab Careers ở `/admin` và việc
  xoá status (dời hàng loạt sang `rejected`) không hiện — dùng nút "Gửi mail" nếu
  cần. *(em chọn)*
- `interview_cancel`: sau khi huỷ, DB không còn giờ cũ → client gửi giờ cũ
  (`prev_scheduled_at`) cho API draft để điền vào câu "buổi PV lúc … đã huỷ". Xoá
  hẳn một vòng PV (DELETE) không hiện hộp thoại *(em chọn)*.
- Đặt lịch lại sau khi huỷ (null → có) là `interview_invite`.
- "Đổi lịch" chỉ tính khi đổi giờ / hình thức / link Meet; đổi tên vòng hay câu hỏi
  không tính.

### Hộp thoại

- Hiện: Người nhận (email ứng viên), Tiêu đề, Nội dung — **sửa được** cả tiêu đề lẫn nội dung.
- Nếu đã từng gửi mail cùng loại cho ứng viên này: hiện cảnh báo "Đã gửi loại này
  lúc …" (không chặn).
- Ở chế độ test: dải cảnh báo nổi bật "Chế độ test — mail sẽ gửi về <địa chỉ test>,
  KHÔNG tới ứng viên".
- Nút **Gửi** / **Không gửi**. Không gửi = đóng, không ghi gì.
- Gửi lỗi: hiện lỗi trong hộp thoại, giữ nội dung để thử lại.

### Nút "Gửi mail" thủ công

Trong modal hồ sơ ứng viên: nút "Gửi mail" → chọn 1 trong 4 loại (không có `interview_cancel` — chỉ hiện ngay lúc huỷ) → cùng hộp thoại.
(`interview_*` cần chọn vòng PV có lịch; nếu chưa có vòng nào thì loại đó bị mờ.)

### Lịch sử

Trong modal hồ sơ: mục "Mail đã gửi" — loại, tiêu đề, thời gian, người gửi, gửi tới
đâu, badge "TEST" nếu là mail test; bấm để xem nội dung.

## Nội dung mẫu (tiếng Việt, xưng "TD Games" — "bạn")

Dữ liệu điền sẵn: tên ứng viên, tên job, giờ PV (giờ VN, dùng `formatInterviewTime`
hoặc định dạng dài hơn kiểu "15:30, Thứ Hai 19/10/2026"), hình thức:
- online → link Google Meet
- offline → địa chỉ văn phòng + link `GOOGLE_MAPS_URL` (`src/lib/company-location.ts`)

Link bài test: `https://tdgamestudio.com/test/<test_token>` (trang `/test/[token]`
hiện có). Không ghi hạn nộp — `job_tests` không có hạn; ứng viên tự chọn ngày dự
kiến nộp (`test_eta`) trên trang test. Mail nhắc ứng viên chọn ngày đó. *(em chọn)*

Địa chỉ văn phòng: "505 Minh Khai, Hà Nội" (đang nằm trong `site-footer.tsx`) —
đưa thành hằng số trong `company-location.ts` dùng chung.

Mail báo trượt: cảm ơn, thông báo chưa phù hợp ở thời điểm này, sẽ giữ hồ sơ cho cơ
hội sau. Không có lý do cụ thể.

Mỗi mail có cả `html` (đơn giản, gần plain-text, logo nhỏ) lẫn `text`. Chữ ký:
"TD Games Studio — Phòng Nhân sự", website, `hr@tdgamestudio.com`.

## Chế độ test / bật thật

- Env trên server (em chọn env thay vì toggle UI để HR không lỡ tay bật):
  - `RESEND_API_KEY`
  - `HR_EMAIL_FROM` (mặc định `TD Games HR <hr@tdgamestudio.com>`)
  - `HR_EMAIL_REPLY_TO` (mặc định `hr@tdgamestudio.com`)
  - `HR_EMAIL_MODE` = `test` | `live` — **thiếu hoặc giá trị lạ ⇒ `test`**
  - `HR_EMAIL_TEST_TO` (mặc định `tony@tdgamestudio.com`)
- Chế độ test: `to` = `HR_EMAIL_TEST_TO`, tiêu đề thêm tiền tố
  `[TEST → <email ứng viên>]`. Quyết định to/test nằm **ở server**; client không gửi
  được địa chỉ người nhận tuỳ ý.
- Bật thật = sếp đổi `HR_EMAIL_MODE=live` trên VPS + `pm2 restart`.
- `GET` cấu hình chế độ (mode, test_to) để UI hiện dải cảnh báo.

## Dữ liệu

Bảng mới `candidate_emails` (migration Supabase):

- `id uuid pk`, `application_id uuid fk applications on delete cascade`
- `interview_id uuid null fk interview_sessions on delete set null`
- `kind text check in (interview_invite, interview_reschedule, interview_cancel, test_assignment, rejection)`
- `to_email text` (email ứng viên), `sent_to text` (địa chỉ thực gửi), `test_mode bool`
- `subject text`, `body_html text`, `body_text text`
- `resend_id text null`, `sent_by text null`, `created_at timestamptz default now()`

Chỉ ghi khi Resend trả 2xx. Lỗi thì trả về client, không ghi.

## API (đều `requireHR`)

- `GET /api/hr/applications/[id]/emails/draft?kind=…&interview_id=…&prev_scheduled_at=…` → `{ to, subject, html, text, mode, test_to, last_sent_at }`
- `POST /api/hr/applications/[id]/emails` body `{ kind, interview_id?, subject, html, text, sent_by? }` → gửi + ghi log
- `GET /api/hr/applications/[id]/emails` → lịch sử

Nội dung HR sửa được gửi lên dạng text; server dựng lại html từ text đã sửa (escape)
để không nhận HTML tuỳ ý từ client. *(em chọn: hộp thoại sửa plain text, html sinh
từ text — đơn giản và an toàn).*

## Ràng buộc

- Next.js 16 App Router, code theo kiểu hiện có (`requireHR`, `getSupabaseAdmin`,
  `x-hr-key`). Gọi Resend bằng `fetch` thẳng, không thêm SDK.
- UI theo styleguide HR hiện tại (`hr-theme.css`, class `hr-*`, icon Lucide, Sáng/Tối).
- Không bấm gửi thử tới ứng viên thật khi test trên local/prod; DB là prod.

## Để builder tự quyết

- Cấu trúc component hộp thoại & cách nối vào các đường đổi status (gợi ý: 1 context
  `promptCandidateMail(app, kind, opts)` ở HRDashboard).
- Câu chữ cụ thể của 5 mẫu (theo khung trên), layout html.
- `sent_by` lấy từ localStorage `tdg.hr.comment.author` (tên tác giả comment); không có thì null.
