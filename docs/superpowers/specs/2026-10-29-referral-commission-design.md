# Bảng hoa hồng giới thiệu (refer) — Design

Ngày: 2026-10-29 · Sếp yêu cầu ("Làm bảng hoa hồng").

## Vì sao
Hiện Phương (HR) theo dõi tay: ứng viên do người khác giới thiệu đi làm được bao lâu → tự tính hoa hồng →
báo Ms. Thảo (Kế toán) chuyển khoản. Không có chỗ ghi chung, dễ sót mốc, dễ nhầm người (mã ref tự do:
`mai-ha` / `mai-ha-headhunt` là một người). Mục tiêu: /hr tự sinh các khoản hoa hồng cần trả khi ứng viên
nhận offer, nhắc đúng hạn, Phương xác nhận ứng viên còn làm, Thảo đánh dấu đã chuyển khoản.

## Sếp đã nói (nguyên ý)
- Phương theo dõi; đi làm thì Phương tính hoa hồng, báo Thảo thanh toán.
- **Nhân viên nội bộ** refer thành công: 2.000.000 — 1.000.000 khi UV đi làm đủ 1 tháng, 1.000.000 khi đủ 2 tháng.
- **Freelancer / headhunter**: rate riêng theo từng job. Có job tiền cố định, có job = 1 tháng lương UV… "tuỳ, không cố định".
- Lịch trả khác nhau theo job: trả ngay khi đi làm / hết 2 tháng mới tính / 50% sau tháng 1 + 50% sau tháng 2…
- **HR mặc định không được hưởng**; nếu có thì có cách tính riêng.
- Phương **được thấy** số tiền hoa hồng (kể cả khi tính theo lương — chấp nhận lộ lương với Phương).

## Mục tiêu / không làm / thất bại nếu
- Mục tiêu: không sót khoản nào; ai cũng thấy khoản nào sắp đến hạn / đến hạn / đã trả; con số đúng theo quy tắc job.
- Không làm: tự chuyển khoản, xuất hoá đơn/thuế TNCN, cổng cho headhunter tự đăng nhập xem hoa hồng.
- Thất bại dù chạy được: trả nhầm khi UV đã nghỉ trước mốc; tính cho HR khi không được hưởng; HR khác (không
  phải người theo dõi) hay Leader thấy tiền hoa hồng.

## Thiết kế

### 1. Người giới thiệu (`referrers`)
Danh sách người được hưởng hoa hồng, quản lý trong /hr (tab mới "Hoa hồng" → mục "Người giới thiệu").
- Trường: tên, loại `internal` (nhân viên nội bộ) | `external` (freelancer / headhunter), các mã ref
  (mảng, mã đầu = mã chính; mã sau = mã cũ/alias, vd. `mai-ha` + `mai-ha-headhunt`), SĐT, email,
  thông tin chuyển khoản (ngân hàng, số TK, chủ TK — text tự do), ghi chú, đang hoạt động.
- Mã ref của referrer không trùng với mã của tài khoản /hr (hr_users.ref_codes) và không trùng giữa các referrer.
- Tài khoản /hr (HR, Sếp…) **không** nằm trong bảng này → mặc định không hưởng. Ngoại lệ "HR có hoa hồng
  riêng": referrer có cột `hr_user_id` trỏ tới tài khoản đó (không có mã riêng — khớp qua mã chính của tài
  khoản, vì POST /api/applications đã đổi alias → mã chính) + **mức riêng** (mục 2). *(Em chọn.)*
- Khởi tạo: liệt kê các mã ref đang có trên hồ sơ mà không thuộc tài khoản nào (`cat-tuong`, `freelancer`,
  `mai-ha`, `mai-ha-headhunt`, `thuy-headhunt`, `thuy-van`, `dieu-anh`…) để Phương phân loại / gộp lần đầu.
  Không tự đoán loại.
- Ô "Tạo link cho headhunter" ở tab Jobs đổi thành **chọn từ danh sách referrer** (vẫn cho gõ mã mới → gợi ý
  thêm vào danh sách).

### 2. Quy tắc hoa hồng
Một quy tắc = **số tiền** + **lịch trả**.
- Số tiền: `fixed` (VND) **hoặc** `salary_multiple` (hệ số × lương cơ bản trong thư mời nhận việc đã được
  Sếp duyệt; vd 1.0 = 1 tháng lương). Lương = `baseSalary` (không cộng phụ cấp). *(Em chọn — xem câu hỏi mở.)*
- Lịch trả: danh sách mốc `{ sau_N_tháng_đi_làm (0 = ngay khi đi làm), phần_trăm }`, tổng = 100%.
- Quy tắc áp theo thứ tự ưu tiên:
  1. **Ghi đè theo người** (referrer có mức riêng) — dùng cho HR được hưởng ngoại lệ.
  2. **Theo job** cho từng loại (`internal` / `external`) — cấu hình trong form job.
  3. **Mặc định công ty** cho từng loại. Mặc định ban đầu: `internal` = 2.000.000, mốc 1 tháng 50% +
     2 tháng 50%. `external` = không có mặc định (job nào chưa đặt → khoản hoa hồng ở trạng thái
     "Chưa đặt mức", nhắc đặt mức).
- Đổi quy tắc job sau khi đã sinh khoản **không** đổi khoản cũ (khoản lưu snapshot quy tắc lúc sinh).
  Sếp/Kế toán sửa tay số tiền từng khoản được (có ghi người sửa).

### 3. Khoản hoa hồng (`referral_payouts`)
- **Sinh khi**: hồ sơ có `offer_status = accepted` **và** `referred_by` khớp một referrer đang hoạt động.
  Mã khớp tài khoản /hr không có ghi đè → không sinh.
- **Ngày đi làm**: mặc định lấy `startDate` trong thư mời; Phương xác nhận / sửa "Ngày đi làm thực tế" trên
  hồ sơ. Chưa xác nhận → các mốc hiển thị "dự kiến".
- Mỗi mốc = một dòng: referrer, ứng viên, job, mốc (vd "Đủ 1 tháng"), số tiền, ngày đến hạn
  (= ngày đi làm + N tháng), trạng thái:
  `upcoming` (chưa đến hạn) → `due` (đến hạn, chờ Phương xác nhận UV còn làm) → `approved` (Phương xác
  nhận, chờ Thảo trả) → `paid` (Thảo bấm đã chuyển khoản, ghi ngày) ; hoặc `cancelled` (UV nghỉ trước mốc /
  offer bị huỷ — ghi lý do).
- **UV nghỉ việc**: Phương ghi "Ngày nghỉ" trên hồ sơ → mọi mốc có ngày đến hạn sau ngày nghỉ và chưa trả
  → `cancelled` tự động.
- Mốc 0 tháng (trả ngay) đến hạn đúng ngày đi làm.

### 4. Màn hình (tab "Hoa hồng" trong /hr)
- **Bảng khoản hoa hồng**: lọc theo trạng thái (mặc định: Đến hạn + Chờ trả), người giới thiệu, job, tháng.
  Tổng tiền theo bộ lọc. Hành động trên dòng: Phương "Xác nhận còn làm" / "Huỷ (UV đã nghỉ)"; Thảo "Đã
  chuyển khoản".
- **Người giới thiệu**: danh sách + thêm/sửa, tổng đã trả / còn phải trả mỗi người, copy link giới thiệu.
- **Cài đặt**: mặc định công ty; quy tắc riêng theo job nằm trong form sửa job.
- Trên hồ sơ ứng viên (khối Offer): dòng "Người giới thiệu: Cát Tường (headhunter) · Hoa hồng: 2 mốc" +
  ngày đi làm thực tế / ngày nghỉ.

### 5. Quyền (bảng quyền hiện có, thêm 2 dòng)
- `referrals.view` — xem tab Hoa hồng & số tiền: Sếp, HR, Kế toán (mặc định bật). Leader: tắt.
- `referrals.manage` — quản lý người giới thiệu, quy tắc, xác nhận còn làm / huỷ: Sếp, HR.
- Đánh dấu **Đã chuyển khoản** + sửa số tiền: Sếp, Kế toán (`referrals.pay`).
  *(Sếp nói "Phương cũng có thể thấy" → HR được xem, kể cả khoản tính theo lương.)*

### 6. Thông báo
- Hằng ngày (cron nhắc sẵn có): khoản chuyển sang `due` → báo Phương (người support của hồ sơ, không có →
  HR mặc định) qua push + Discord tag. Khoản `approved` → báo Kế toán.
- Không đưa số tiền / lương vào Discord kênh chung.

## Ràng buộc
- Next.js 16 App Router, Supabase (migration mới), quyền qua `hr-permissions.ts` + bảng override; gác ở server.
- Thư mời nhận việc chỉ Kế toán/Sếp xem → tính `salary_multiple` ở server, trả về **số tiền hoa hồng**,
  không trả lương.
- Tiền VND số nguyên.

## Quyết định của em (sếp xem lại khi đọc)
- Lương cho `salary_multiple` = baseSalary của thư mời **bản đã duyệt** tại lúc offer chuyển "Đã nhận"; lưu
  snapshot số tiền. Thiếu thư/lương → khoản ở trạng thái "Thiếu lương", không ghi 0.
- Ngày đến hạn theo giờ Việt Nam; cộng tháng kẹp cuối tháng (31/1 + 1 tháng = 28/2). Nghỉ đúng ngày đến hạn
  = vẫn tính đủ mốc.
- Chia % làm tròn xuống đồng, phần dư dồn vào mốc cuối; % là số nguyên, tổng 100.
- Thư mời chưa có ngày bắt đầu → chưa có ngày đến hạn cho tới khi Phương xác nhận ngày đi làm; đổi ngày đi
  làm → tính lại các mốc chưa trả.
- Khoản sinh khi offer = "Đã nhận" (trong PATCH hồ sơ, không sinh trùng); cron hằng ngày chuyển upcoming →
  due + nhắc; giao diện cũng tự tính trạng thái khi đọc phòng cron lỗi.
- Có nút "Tính lại" cho hồ sơ khi người giới thiệu / quy tắc được thêm sau.
- HR (`referrals.manage`) sửa được người giới thiệu của hồ sơ (gõ nhầm/thiếu mã) — có ghi lịch sử.
- Người giới thiệu nội bộ nghỉ việc trước mốc → vẫn trả (khoản gắn với ứng viên đi làm, không gắn người giới
  thiệu còn làm). Muốn khác thì huỷ tay.
- Sếp/Kế toán sửa được số tiền + ngày đến hạn từng khoản, ghi cũ/mới/ai/lúc nào; khoản đã trả chỉ ghi chú.
- Quy tắc theo job chỉ trả về cho người có `referrals.view` (Leader không thấy).
- Gõ mã mới ở "Tạo link cho headhunter" → tạo referrer "chưa phân loại"; khoản của họ ở "Chưa đặt mức" tới khi
  Phương phân loại.
- Báo Kế toán qua Discord tag + push (mở `push.receive` cho Kế toán ở thông báo này).
- 3 quyền: `referrals.view`, `referrals.manage`, `referrals.pay`.

## Để builder tự quyết
Tên bảng/cột, cách chạy cron sinh/chuyển trạng thái (cron hằng ngày sẵn có hoặc tính lúc đọc), bố cục chi tiết UI
theo token --hr-*.
