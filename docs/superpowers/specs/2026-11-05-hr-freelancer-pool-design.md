# /hr — Màn hình Freelancer (kho freelancer) — thiết kế

Ngày: 2026-11-05 · Người quyết: sếp (Tony) · Trạng thái: chờ duyệt

## 1. Vì sao

Freelancer không đi theo quy trình tuyển fulltime (Reviewing → Phone screening → Test → Interview → Offer / Reject).
Khi có dự án cần người, ví dụ dự án A cần animator Spine 2D, sếp làm theo các bước sau:

1. Lọc người theo job/kỹ năng, hạng và rate.
2. Xem thông tin, portfolio và rate/giờ. Thấy hợp thì gửi thông tin dự án để trao đổi.
3. Phần lớn trường hợp cho làm test. Test ổn thì ký hợp đồng + NDA rồi triển khai.
4. Sau khi hợp tác, sếp add người đó vào **TD Games Platforms** để nghiệm thu và theo dõi chi phí.
   Phần này **không** làm trên /hr.

Freelancer vì vậy là một **kho người dùng đi dùng lại**, không có Offer hay Reject.
Hiện hồ sơ freelancer đang nằm lẫn trong bảng fulltime (cột "Freelancer" và "Lưu hồ sơ").
Ở đó không lọc được theo hạng/rate và không biết người nào đã từng hợp tác.

## 2. Mục tiêu

- Thêm một tab **Freelancer** riêng trên /hr, liệt kê mọi hồ sơ freelancer.
- Lọc được theo: **job**, **hạng**, **khoảng rate (VNĐ/giờ)**, **trạng thái**, **đã từng hợp tác chưa**, **có vấn đề không**,
  **job chưa mở freelance**. Có ô tìm theo tên/email.
- Mỗi hồ sơ có **5 trạng thái** (sếp chốt): **Mới → Đang trao đổi → Đang test → Đã hợp tác**, cộng thêm **Chưa phù hợp**.
  "Chưa phù hợp" là lưu lại cho lần sau, không phải bị loại.
- **Hạng** (sếp chốt): **Fresher / Junior / Middle / Senior**. HR hoặc sếp gắn sau khi xem hồ sơ hoặc test,
  ứng viên không tự khai.
- **Ghi chú chung chung** (sếp chốt), kiểu "đã hợp tác dự án A, ổn" hoặc "trễ deadline".
  Dùng lại ô **Ghi chú** hiện có (`admin_notes`), thêm một cờ **"Có vấn đề"** để lọc.
- Hồ sơ freelancer **không còn hiện ở bảng fulltime** (Pipeline/Data/KPI/số đếm).

## 3. Không làm

- **Không thêm hồ sơ bằng tay** (sếp chốt). Freelancer chỉ vào qua form apply như hiện nay:
  HR gửi link JD, ứng viên chọn hình thức **Freelancer**.
- Không quản lý hợp đồng, NDA, nghiệm thu, chi phí (đã có trên Platforms). Không đồng bộ với Platforms.
- Không có Offer / Reject / thư mời nhận việc / hoa hồng giới thiệu cho freelancer.
  Hoa hồng vốn đã loại freelancer (`isCommissionable`).

## 4. Không được xảy ra (anti-goals)

- **Không gửi mail mới hay mail bù cho ứng viên** khi chuyển dữ liệu cũ sang luồng mới
  (xem memory candidate-mail-confirm-first). Đổi trạng thái freelancer **không** tự gửi mail.
- Bảng fulltime không được thiếu hay mất hồ sơ fulltime nào. Số liệu KPI fulltime không bị lẫn freelancer.
- Freelancer không bị **tự từ chối** theo luật ứng viên trùng (xem 6.4).

## 5. Luồng nộp đơn (giữ như 2026-11-04, chỉ đổi chỗ hồ sơ vào)

Ứng viên chọn Freelancer trên form `/apply/[slug]`:

| Job | Mail (giữ nguyên) | Trạng thái freelancer | Nhãn |
|---|---|---|---|
| Job **có** nhận freelancer (`jobAcceptsFreelance`) | `freelance_received` | Mới | — |
| Job **chưa** nhận freelancer | `freelance_not_open` | Mới | **Job chưa mở freelance** (sếp chốt: cũng nằm trong màn Freelancer) |

Trước đây job chưa nhận thì hồ sơ vào `talent_pool`. Từ nay mọi đơn freelancer có cùng một `status` ở bảng chung
(xem 6.1), còn tiến độ thật nằm ở trạng thái freelancer.

Thông báo Discord/Telegram khi có đơn mới vẫn giữ. Dòng 🧩 đổi thành "→ tab Freelancer", có ghi "job chưa mở freelance" khi đúng.

**Rate trên form (đề xuất của em):** ô rate của freelancer đổi thành **ô số, đơn vị VNĐ/giờ, bắt buộc**
(sếp lọc theo rate/giờ). Thêm ô chữ tuỳ chọn "Ghi chú về giá" (ví dụ giá theo asset hoặc theo dự án), lưu vào `rate_per_hour`.
Dữ liệu hiện tại đang là chữ tự do: "250.000 VNĐ", "150000", "100000", và có người ghi nhầm "40 hours".

## 6. Thiết kế kỹ thuật (đề xuất của em — builder được điều chỉnh)

### 6.1 Dữ liệu

Hồ sơ freelancer vẫn nằm trong bảng `applications`, phân biệt bằng `work_type = 'freelancer'`. Không tách bảng,
để dùng lại được modal hồ sơ, bình luận, AI chấm, bài test, mail, phân quyền và thông báo.

Thêm cột vào `applications`:
- `freelance_stage text` — `new | talking | testing | collaborated | not_fit`, mặc định `new`; chỉ có nghĩa khi work_type = freelancer.
- `freelance_level text null` — `fresher | junior | middle | senior`.
- `rate_vnd_per_hour integer null` — rate dạng số để lọc. Cột chữ `rate_per_hour` giữ nguyên cho dữ liệu cũ và để hiển thị.
- `freelance_issue boolean not null default false` — cờ "Có vấn đề".
- `freelance_job_open boolean null` — job có nhận freelancer **tại lúc nộp** hay không. Nhãn "Job chưa mở freelance" lấy từ cột này.

`status` (cột pipeline chung) của mọi đơn freelancer = `'freelancer'`. Key này đã có trong `application_statuses`, kind `open`.
Giữ như vậy để phân quyền theo phạm vi (`autoAssigneeFor`, scope theo status/leader) chạy như cũ.
Key `freelancer` mới được thêm tay trên DB prod, chưa có migration nào tạo. Migration phải `insert … on conflict do nothing`
để môi trường mới cũng có key này.
**Khoá trạng thái:** API đổi status (`PATCH /api/hr/applications/[id]` và các thao tác hàng loạt) **chặn** việc đổi `status`
của đơn freelancer, và chặn đưa đơn fulltime vào `status='freelancer'`. Freelancer chỉ có trạng thái freelancer (6.3).
Muốn đổi hình thức thì dùng thao tác riêng (xem câu hỏi mở ở mục 9).

Migration **chỉ thêm** (ADD COLUMN, CHECK mới qua ADD CONSTRAINT), không có DROP.

### 6.2 Chuyển dữ liệu cũ (không gửi mail)

- Mọi đơn `work_type='freelancer'` (hiện có 4) → `status='freelancer'`, `freelance_stage='new'`.
  Riêng Đỗ Thạch Lam (đang `talent_pool`) → `status='freelancer'`, `freelance_job_open=false`.
- `freelance_job_open` của đơn cũ = cờ hiện tại của job.
- `rate_vnd_per_hour` của đơn cũ: lấy các chữ số trong `rate_per_hour` nếu ra số hợp lý (≥ 10.000);
  không thì để trống ("40 hours" → trống). HR sửa tay được.

### 6.3 Tab Freelancer (UI)

- Thêm view `freelancers` vào `HRDashboard`. Ai xem được tab Pipeline thì xem được tab này; phạm vi hồ sơ như hiện tại
  (Leader chỉ thấy hồ sơ job mình phụ trách).
- Dạng **bảng/danh sách** gồm: tên, job, hạng, rate (VNĐ/giờ), giờ/tuần, portfolio, trạng thái, nhãn (Đã hợp tác,
  Có vấn đề, Job chưa mở freelance, Nộp trùng), ngày nộp, người support.
  Trên đầu có thanh chip đếm theo trạng thái.
- Bộ lọc: job, hạng, rate từ–đến, trạng thái, đã hợp tác (stage = collaborated), có vấn đề, job chưa mở freelance, tìm tên/email.
- Bấm vào một dòng → mở **modal hồ sơ hiện có**, ở chế độ freelancer:
  - Thay khối Trạng thái / "Chuyển sang Reviewing" / Reject bằng: **dropdown trạng thái freelancer**, **dropdown hạng**,
    **ô rate VNĐ/giờ**, **ô tick "Có vấn đề"**.
  - Giữ lại: Ghi chú, bình luận, Đánh giá AI, Bài test (copy link test của job), lịch sử mail, liên hệ & hồ sơ, CV.
  - Menu "Gửi mail" của freelancer chỉ còn: Gửi bài test, Mời/đổi/huỷ lịch trao đổi (dùng mẫu phỏng vấn hiện có).
    Ẩn: Offer, Kết quả (không phù hợp), Hồ sơ đang xem xét, Vị trí đã tuyển đủ.
  - Đổi trạng thái/hạng/rate **không gửi mail**. Có ghi vào lịch sử/bình luận nếu luồng fulltime đang làm như vậy.
- **Rate theo quyền:** cột rate, bộ lọc rate và ô sửa rate chỉ hiện với người có `apps.view_salary`, như cách đang ẩn
  `rate_per_hour`/lương hiện nay. `rate_vnd_per_hour` cũng bị che theo quyền này ở API.
- **Kế toán:** phạm vi giữ như hiện nay với status `freelancer` (kind open), không mở rộng thêm.
- Mobile 390px dùng được (bảng cuộn ngang hoặc chuyển thành thẻ).

### 6.4 Luật ứng viên trùng

- Đơn **freelancer mới** không bao giờ bị auto-reject (freelancer không có Reject). Vẫn gắn "Nộp trùng" / liên kết
  "Hồ sơ khác" và giữ quyền giới thiệu như hiện tại.
- Đơn fulltime bị auto-reject chỉ khi hồ sơ trước là **fulltime** rejected. Freelancer không có rejected nên tự nhiên đúng.
- Bỏ luật hiện tại (route.ts) đang auto-reject đơn freelancer mới khi trước đó có đơn fulltime rejected cùng vị trí.
- Nhãn "Nộp trùng" vẫn gắn **chéo** giữa freelancer và fulltime, vì đó là thông tin hữu ích (ví dụ Nguyễn Hồ Ngọc Anh
  nộp freelancer rồi nộp fulltime cùng job). Người support của đơn mới vẫn lấy theo hồ sơ cũ như hiện tại.

### 6.5 Bảng fulltime

Pipeline, Data, KPI, số "đang xử lý", đóng tuyển ("Vị trí đã tuyển đủ" gửi hàng loạt), xếp hạng AI theo job
→ **bỏ qua** `work_type='freelancer'`. Builder rà mọi chỗ đọc `applications` cho các màn này.

## 7. Để builder quyết

Bố cục cụ thể của bảng/bộ lọc (theo styleguide /hr hiện tại), cách lưu bộ lọc, API (route mới hay mở rộng
`/api/hr/applications`), tên quyền (dùng quyền sẵn có của hồ sơ nếu đủ), cách hiển thị rate (định dạng 150.000đ/giờ).

## 8. Các quyết định em tự chọn (sếp xem giúp)

1. Tách thành **tab mới**, dữ liệu vẫn ở bảng `applications`.
2. Freelancer **không bao giờ bị auto-reject** khi nộp trùng.
3. Rate trên form đổi thành **ô số VNĐ/giờ**; đơn cũ tự đọc số, đọc không được thì để trống.
4. "Có vấn đề" là **cờ tick riêng** + ghi chú (dùng ô Ghi chú hiện có).
5. Menu mail của freelancer chỉ còn bài test + lịch trao đổi.
6. API khoá không cho đổi pipeline status của đơn freelancer (không Offer/Reject, không gửi "đã tuyển đủ").
7. "Nộp trùng" vẫn gắn chéo freelancer ↔ fulltime, nhưng không auto-reject freelancer.
8. Rate/giờ là ô số bắt buộc, kèm ô "Ghi chú về giá" tuỳ chọn. Ai không có quyền xem lương thì không thấy rate.

## 9. Câu hỏi mở (chờ sếp)

- Có 1 hồ sơ **fulltime** đã bị HR kéo tay vào cột "Freelancer" (Lê Thị Kim Chi, Graphic Designer, 29/09).
  Cách xử lý hồ sơ này, và việc HR muốn chuyển một ứng viên fulltime thành freelancer (hoặc ngược lại), chờ sếp quyết.
