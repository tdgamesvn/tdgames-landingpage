# HR: đăng nhập theo tài khoản + phân quyền theo vai — Design

Ngày: 2026-10-27 · Người yêu cầu: sếp (tony@tdgamestudio.com)

## Vì sao

`/hr` hiện vào bằng **một mật khẩu chung** (`src/lib/hr-auth.ts`: `app_settings.hr_secret`
→ `HR_SECRET` → `ADMIN_SECRET`, client gửi header `x-hr-key`, 27 route dùng `requireHR`).
Ai có mật khẩu là thấy và làm mọi thứ, hệ thống không biết ai đang thao tác (tên người
comment / chấm bài lấy từ ô nhập tay lưu `localStorage`, `sent_by` của mail cũng thế).

Sếp muốn: mỗi người một tài khoản, phân quyền sâu hơn theo vai, và sếp tự bật/tắt quyền
được mà không cần sửa code.

## Người dùng & vai (sếp chốt)

| Vai | Làm gì | Phạm vi dữ liệu |
|---|---|---|
| **Sếp** | Toàn quyền. Duy nhất được tạo/khoá tài khoản và sửa bảng quyền. | Tất cả |
| **HR** | Vận hành toàn bộ tuyển dụng (hồ sơ, lịch PV, mail, bài test, AI chấm, xếp hạng). Gán Leader vào job. | Tất cả |
| **Leader** | Xem hồ sơ, comment, chấm bài test. | **Chỉ job mình phụ trách** (mỗi job **1 Leader**; một Leader có thể phụ trách nhiều job — sếp chốt) và ứng viên của các job đó |
| **Kế toán** | Soạn + gửi mail offer, theo dõi ứng viên nhận / từ chối offer, giải đáp thắc mắc của ứng viên. | **Ứng viên từ bước Interview trở đi** (sếp chốt) — xem mục "Kế toán & offer" |

- Leader trong một hồ sơ **chỉ thấy**: CV, Portfolio, bài test (đề + bài nộp + chấm),
  lịch PV, comment (sếp chốt). Không thấy: lương mong muốn, điểm/đánh giá AI, MBTI,
  phân tích ghi âm PV, lịch sử mail, liên hệ (email/SĐT) — *em suy ra từ danh sách sếp đưa;
  các nhóm này là quyền trong bảng nên sếp mở lại được.*
- Gán Leader vào job: **Sếp hoặc HR** (sếp chốt).

## Đăng nhập (sếp chốt)

- Email **bất kỳ** (không bắt buộc `@tdgamestudio.com`) + mật khẩu.
- **Không có trang tự đăng ký.** Sếp tạo tài khoản (email, tên hiển thị, vai) → hệ thống
  gửi mail mời có link riêng để người đó tự đặt mật khẩu. Không ai vào link mà tự tạo
  được tài khoản.
- "Quên mật khẩu": gửi link đặt lại, chỉ có tác dụng với tài khoản đã tồn tại và chưa bị
  khoá; với email lạ vẫn trả lời "nếu email tồn tại, đã gửi link" (không lộ danh sách).
- Khoá tài khoản → mất quyền ngay ở request kế tiếp (không chờ hết hạn phiên).

## Bảng quyền (sếp chốt: có bảng tích chọn, nếu không quá phức tạp)

- Một **danh sách quyền duy nhất trong code** (`src/lib/hr-permissions.ts`), mỗi quyền có
  key, nhãn tiếng Việt, nhóm, và mặc định cho từng vai HR / Leader / Kế toán.
- Bảng tích chọn trên UI **tự sinh từ danh sách đó**; DB chỉ lưu các ô sếp đã đổi so với
  mặc định. Thêm chức năng mới = thêm 1 dòng + chọn mặc định, bảng tự có ô mới.
- Bảng theo **vai**, không theo từng người (em đề xuất, sếp OK). **Vai Sếp luôn toàn quyền,
  không tắt được** — tránh tự khoá.
- Phạm vi dữ liệu (Leader chỉ job mình, Kế toán từ bước Interview) là **luật cố định theo vai**,
  không nằm trong bảng tích — *em quyết.*

Danh sách quyền khởi đầu (*em đề xuất, builder chỉnh tên/gom nhóm được*; ✓ = mặc định bật):

| Quyền | HR | Leader | Kế toán |
|---|---|---|---|
| Xem hồ sơ cơ bản (tên, job, trạng thái, CV, portfolio) | ✓ | ✓ | ✓ |
| Xem liên hệ (email, SĐT) | ✓ | | ✓ |
| Xem lương mong muốn | ✓ | | ✓ |
| Xem điểm & đánh giá AI, MBTI, xếp hạng | ✓ | | |
| Xem lịch PV | ✓ | ✓ | ✓ |
| Xem phân tích ghi âm PV | ✓ | | |
| Xem / viết comment | ✓ | ✓ | ✓ |
| Xem bài test & bài nộp | ✓ | ✓ | |
| Chấm bài test (Leader review) | ✓ | ✓ | |
| Sửa hồ sơ / đổi trạng thái | ✓ | | (chỉ interview → offer, và ghi kết quả nhận/từ chối offer) |
| Xoá hồ sơ | ✓ | | |
| Tạo / sửa lịch PV, upload & phân tích ghi âm | ✓ | | |
| Gửi mail ứng viên (mời PV, bài test, báo trượt…) | ✓ | | |
| Gửi mail offer | ✓ | | ✓ |
| Quản lý job, bài test, trạng thái pipeline, quy tắc xếp hạng | ✓ | | |
| Gán Leader vào job | ✓ | | |
| Chạy AI chấm / xếp hạng | ✓ | | |
| Nhận thông báo đẩy nhắc lịch PV | ✓ | ✓ | |

Quản lý tài khoản + sửa bảng quyền: **chỉ vai Sếp**, không nằm trong bảng.

## Kế toán & offer

- Quy trình (sếp chốt): sau PV, Sếp hoặc Leader nhắn Kế toán ai đạt → **Kế toán tự chuyển
  trạng thái `interview` → `offer` và gửi mail offer**. (Nhắn ngoài hệ thống, không cần
  nút "báo đạt" trong /hr.)
- Phạm vi Kế toán: hồ sơ đang ở `interview` hoặc `offer`, **cộng** hồ sơ đã từng có
  `offer_status` (để người từ chối offer rồi bị chuyển `rejected` vẫn còn thấy) — *em quyết.*
  Trạng thái pipeline sếp thêm sau này nằm sau `offer` (theo `sort_order`) cũng tính vào.
  Kế toán được xem lịch PV của hồ sơ trong phạm vi (để biết ai vừa PV) — *em quyết, là ô
  trong bảng quyền.*
- Cần **mẫu mail mới `offer`** trong `src/lib/hr-email.ts` (cùng hộp thoại xác nhận, cùng
  chế độ test/live như các mail hiện có — spec `2026-10-26-hr-candidate-email-design.md`).
- "Theo dõi nhận offer": thêm trường kết quả offer trên hồ sơ — `offer_status`:
  `pending` (đã gửi, chờ) / `accepted` / `declined`, cùng thời điểm cập nhật — *em quyết;
  nội dung mẫu mail offer (các trường lương, ngày bắt đầu…) builder soạn rồi sếp duyệt
  như các mẫu trước.*
- "Giải đáp thắc mắc": qua comment trong hồ sơ + mail (Reply-To vẫn về hộp thư thật).
  **Không** làm inbox trong /hr (giữ non-goal của spec mail).

## Ghi đúng người làm

Mọi thao tác ghi tên/ID tài khoản đang đăng nhập thay cho ô nhập tay: comment `author`,
mail `sent_by`, Leader review, đổi trạng thái. Bỏ ô "tên của bạn" + `COMMENT_AUTHOR_KEY`
ở `HRDashboard.tsx`. Dữ liệu cũ giữ nguyên chuỗi tên đã lưu.

## Cách làm (em quyết — builder giữ trừ khi có lý do mạnh)

> **Cập nhật khi lập plan (2026-10-27):** đổi sang tài khoản + phiên **tự quản trong Postgres** (scrypt, cookie httpOnly, token mời 7 ngày) thay Supabase Auth — lý do trong plan `docs/superpowers/plans/2026-10-27-hr-accounts-permissions.md`. Các gạch đầu dòng Supabase Auth bên dưới không còn áp dụng.

- **Supabase Auth** (cùng project `zjunfcyymesfpeikspzf`, repo này chưa dùng Auth ở đâu):
  email + password. Tắt "Allow new users to sign up" trên Supabase.
- Mời / quên mật khẩu: server gọi `auth.admin.generateLink({ type: 'invite' | 'recovery' })`
  lấy link rồi **tự gửi qua Resend từ `hr@`** (không dùng SMTP mặc định của Supabase).
  Mail cho nhân viên **không** bị chế độ test `HR_EMAIL_MODE` chặn (chế độ đó chỉ dành cho
  mail ứng viên).
- Phiên đăng nhập: cookie httpOnly qua `@supabase/ssr`. API không còn nhận `x-hr-key`.
- Bảng mới (tên do builder đặt): hồ sơ nhân viên (`user_id`, tên hiển thị, vai, khoá
  hay không), Leader phụ trách job (cột `leader_user_id` trên `jobs`, 1 job 1 Leader), các ô quyền sếp đã đổi.
- `requireHR(req)` thay bằng helper trả về `{ user, role, can(perm) }`; mỗi route kiểm
  quyền cụ thể **và** áp phạm vi dữ liệu (Leader/Kế toán) ở server — list, search, ranking,
  chi tiết hồ sơ, interviews, submissions, upload, push. **Ẩn ở server** (không trả field),
  không chỉ ẩn trên UI.
- UI: trang đăng nhập + trang đặt mật khẩu; tab "Tài khoản & quyền" chỉ vai Sếp thấy;
  chỗ gán Leader trong màn hình job; ẩn nút/tab khi không có quyền.

- **Cron nhắc lịch** (`.github/workflows/hr-remind.yml`, `hr-interview-remind.yml` gọi
  `/api/hr/remind`, `/api/hr/interviews/remind` bằng `x-hr-key`): đổi sang secret riêng
  `HR_CRON_SECRET`, chỉ hai route này nhận — *em quyết.*
- **Thông báo đẩy**: `hr_push_subscriptions` thêm `user_id`; nhắc lịch PV chỉ gửi tới
  người có quyền và trong phạm vi (Leader chỉ job mình). Thiết bị đăng ký cũ không gắn
  người → phải bật chuông lại sau khi đăng nhập (báo trước cho team) — *em quyết.*

## Chuyển đổi

1. Tạo tài khoản Sếp đầu tiên (tony@) bằng script/seed.
2. Giai đoạn chuyển: mật khẩu chung **vẫn chạy song song như vai Sếp** cho tới khi sếp tạo
   xong tài khoản cho mọi người.
3. Sếp xác nhận → gỡ hẳn `x-hr-key` / `hr_secret` (bước riêng, deploy riêng).
   *Em quyết — tránh cả team bị khoá ngoài lúc deploy.*

## Không làm (non-goals)

- Không tự đăng ký, không đăng nhập Google (thêm sau nếu cần).
- Không quyền riêng từng người (chỉ theo vai).
- Không đụng `/admin` (vẫn `x-admin-key`) và trang công khai `/careers`, `/test/...`.
- Không inbox mail trong /hr.

## Anti-goals (coi là hỏng dù chạy được)

- Có cách tự tạo tài khoản không qua sếp (link mời dùng lại được, signup Supabase còn mở…).
- Leader / Kế toán lấy được dữ liệu ngoài phạm vi bằng cách gọi thẳng API hoặc đổi ID.
- Field bị ẩn (lương, điểm AI…) vẫn có trong JSON trả về, chỉ bị giấu trên giao diện.
- Sếp tự khoá mình khỏi hệ thống.
- Deploy xong cả team không vào được vì chưa có tài khoản.

## Để builder quyết

Tên bảng/cột, cấu trúc helper, giao diện các màn mới (theo styleguide TD Games Work v4
đang dùng ở /hr), thời hạn link mời (đề xuất 7 ngày) và thời hạn phiên, cách tách quyền
nhỏ hơn bảng trên nếu cần.

## Chấm bài test (sếp chốt)

Mỗi job 1 Leader nên giữ **một đánh giá duy nhất** như hiện tại (`applications.test_review`),
chỉ thêm **tên + ID tài khoản người chấm** lấy từ phiên đăng nhập và hiển thị tên đó.
Nhiều Leader / mỗi người một bản: để sau, chưa làm.

## Tự động CC nội bộ khi gửi mail ứng viên (sếp yêu cầu 2026-10-27: "tùy mail cc người phù hợp")

Địa chỉ CC lấy từ email tài khoản (chỉ tài khoản chưa khoá). Bảng CC mặc định — *em quyết, sếp duyệt:*

| Mail | CC |
|---|---|
| Mời PV / đổi lịch / huỷ lịch PV | HR + Leader của job |
| Gửi bài test | HR + Leader của job |
| Báo trượt | HR |
| Offer | Kế toán + HR + Sếp |

- Người đang gửi không bị CC chính mình. Trùng địa chỉ thì gộp.
- Hộp thoại gửi mail hiện danh sách CC, người gửi bỏ bớt được trước khi bấm Gửi.
- Bảng CC nằm trong code cạnh mẫu mail (thêm mẫu mới = khai báo CC luôn).
- **Chế độ test** (`HR_EMAIL_MODE` ≠ live): không CC ai, hộp thoại vẫn hiện "Khi bật thật sẽ CC: …"
  để sếp kiểm tra — tránh spam team khi thử.
- Ghi danh sách CC vào lịch sử mail (`candidate_emails`).
