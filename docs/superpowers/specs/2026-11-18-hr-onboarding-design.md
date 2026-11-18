# /hr — Onboard người mới: ngày đi làm + checklist + nhắc việc

Ngày: 2026-11-18 · Trạng thái: chờ sếp duyệt

## Ý định & lý do

HR (người support hồ sơ, vd. Phương) muốn biết **ngày đi làm** của ứng viên khi ứng viên **đã nhận offer**, để theo dõi và hỗ trợ bạn ấy những ngày đầu. Hôm nay ngày đi làm nằm trong thư mời (HR không xem được vì có lương — luồng offer chỉ Kế toán + Sếp, chốt 2026-10-29) và một dòng "Ngày đi làm thực tế" khuất trong mục *Hoa hồng giới thiệu* — không có danh sách, không nhắc việc, không có việc cần làm.

Sếp chọn mức **C**: thấy ngày đi làm + được nhắc + checklist onboard để tích.

## Mục tiêu

1. Hồ sơ đã nhận offer hiện **ngày đi làm** rõ ràng: trên thẻ ở cột Offer và một khối **Onboard** riêng trong hồ sơ.
2. **Checklist onboard chung** cho mọi người (không chia intern / chính thức), sửa được trong /hr; mỗi hồ sơ có bản riêng để tích, ghi ai tích lúc nào.
3. **Nhắc việc tự động** (Discord + chuông app) cho người support + Leader của job (+ Sếp theo luật chung): 1 ngày làm việc trước, sáng ngày đi làm, cuối tuần đầu.

## Không làm (non-goals)

- Không gửi gì cho ứng viên (không mail chào mừng, không nhắc ứng viên).
- Không quản lý hợp đồng / hồ sơ nhân sự sau onboard; không theo dõi thử việc dài hạn.
- Không checklist theo vai trò / theo job (sếp chốt: một danh sách chung).
- Không đổi luồng hoa hồng (chỉ dùng chung nguồn ngày đi làm).

## Anti-goals (làm vậy là hỏng dù "chạy được")

- **Lộ lương** cho HR/Leader qua khối Onboard, thẻ, Discord hay push.
- **Hai ngày đi làm lệch nhau** (onboard một ngày, hoa hồng một ngày).
- Nhắc trùng / spam (cùng một mốc nhắc 2 lần, hoặc nhắc mãi khi đã xong).
- Phải nhập tay ở 2 nơi.

## Checklist mặc định (sếp OK 2026-11-18)

| # | Giai đoạn | Việc | Leader tích được |
|---|---|---|---|
| 1 | Trước ngày đi làm | Nhắn/gọi xác nhận lại ngày giờ đi làm với ứng viên | |
| 2 | Trước ngày đi làm | Báo Leader & team ngày người mới vào | |
| 3 | Trước ngày đi làm | Chuẩn bị chỗ ngồi, máy tính, thiết bị (màn hình, wacom…) | |
| 4 | Trước ngày đi làm | Tạo tài khoản: email công việc, Discord, công cụ team dùng | |
| 5 | Ngày đầu | Đón, giới thiệu công ty & team (training hội nhập) | |
| 6 | Ngày đầu | Ký hợp đồng (CTV / thử việc / chính thức) | |
| 7 | Ngày đầu | Nhận giấy tờ (bản sao CCCD…) | |
| 8 | Ngày đầu | Leader hướng dẫn quy trình & giao việc đầu tiên | ✓ |
| 9 | Cuối tuần đầu | Hỏi thăm cảm nhận / khó khăn của bạn mới | |

## Cách tiếp cận (đã cân nhắc)

1. **Khối Onboard riêng — bảng mới + mẫu checklist trong app_settings (SẾP CHỌN).** Độc lập với hoa hồng về dữ liệu checklist và quyền; ngày đi làm vẫn dùng chung nguồn với hoa hồng. Tốn thêm 1 migration.
2. Gắn checklist vào `referral_placements` (đã có `start_date` từng hồ sơ). Ít việc hơn nhưng trộn onboard với hoa hồng: quyền xem lẫn nhau, sửa phần này dễ vỡ phần kia. Loại.
3. Comment / công cụ ngoài (ClickUp, Sheet). Không nhắc tự động, nhập 2 nơi. Loại.

## Thiết kế

### Khi nào hồ sơ "vào onboard"

- Hồ sơ có `offer_status = 'accepted'` (Kết quả offer = Đã nhận) và không phải freelancer (`work_type <> 'freelancer'`).
- Offer chuyển khỏi `accepted` (đổi ý / từ chối) → khối Onboard ẩn, ngừng nhắc; dữ liệu checklist giữ nguyên (quay lại `accepted` thì hiện lại như cũ).

### Ngày đi làm — một nguồn duy nhất

- Dùng đúng `effectiveStartDate(appId)` hiện có (`src/lib/referral-store.ts`): `referral_placements.start_date` nếu có, không thì `startDate` trên thư mời; kèm cờ `confirmed`.
- Khối Onboard cho sửa ngày đi làm (người có quyền sửa onboard). Lưu = **đúng hành vi** khi sửa "Ngày đi làm thực tế" ở mục hoa hồng (`PATCH /api/hr/referrals/applications/[id]` với `start_date`: `savePlacement` + dời hạn các khoản hoa hồng + áp lại huỷ mốc sau ngày nghỉ). Tách phần xử lý đó thành hàm dùng chung (vd. `applyStartDateChange(appId, date)`) để cả hai route gọi — không nhân bản logic. (Hiện không ghi lịch sử đổi ngày; bản này cũng không thêm.)
  - *Quyết định của em:* Kế toán có `onboard.edit` nên đổi được ngày đi làm dù không có `referrals.manage`. Không phải lỗ quyền: ngày đi làm thực tế là sự thật cần ghi đúng, hoa hồng phải chạy theo nó; Kế toán vốn đã sửa được hạn từng khoản (`referrals.pay`).
- Xoá ngày (`start_date: null`) = **về ngày trên thư mời** (vì `effectiveStartDate` rơi về thư mời); nút ghi "Về ngày trên thư mời", không ghi "Xoá".
- Không có ngày nào (offer gửi ngoài hệ thống, chưa có thư) → khối Onboard hiện "Chưa có ngày đi làm" + ô nhập; chưa nhắc gì.
- Ngày lấy từ thư mời (chưa xác nhận) **vẫn nhắc** — đó chính là ngày dự kiến cần chuẩn bị; thẻ/khối ghi "dự kiến".
- Dữ liệu trả về cho khối Onboard **chỉ** gồm ngày + cờ dự kiến/thực tế — không trả field nào của thư mời khác.

### Dữ liệu

**Mẫu checklist công ty**: `app_settings` key `hr_onboarding_checklist` (JSON). Thiếu → dùng mẫu mặc định trong code (bảng trên). Mỗi mục: `{ id, label, stage: 'before'|'day1'|'week1', leader: boolean }`. `id` sinh khi thêm mục (ổn định khi đổi tên).

**Bảng mới `hr_onboarding`** (migration mới):

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `application_id` | uuid PK, FK applications ON DELETE CASCADE | 1 hồ sơ 1 dòng |
| `items` | jsonb | bản chụp mẫu lúc tạo + trạng thái: `[{ id, label, stage, leader, done_at, done_by_user_id, done_by_name }]` |
| `reminded` | jsonb | `{ before?: { at, for_date }, day1?: {...}, week1?: {...} }` — mốc đã nhắc và cho ngày đi làm nào |
| `created_at`, `updated_at` | timestamptz | |

- Dòng được tạo **lười** bằng một hàm `ensureOnboarding(appId)` (`insert … on conflict do nothing` rồi đọc lại), gọi từ GET/PATCH hồ sơ **và từ cron nhắc** (để nhắc liệt kê được mục chưa tích dù chưa ai mở hồ sơ). Chụp mẫu hiện tại.
- Tích/bỏ tích: đọc–sửa–ghi `items` có kiểm `updated_at` (2 người tích cùng lúc không mất của nhau; xung đột → đọc lại và áp lại 1 lần, vẫn lỗi → 409). Sửa mẫu sau đó **không** đổi checklist đã tạo (dễ đoán; mẫu chỉ áp cho người onboard sau).
- Trong khối Onboard có thể thêm/xoá mục riêng cho hồ sơ? → **Không** ở bản này (YAGNI); chỉ tích/bỏ tích.

### Quyền (thêm vào `HR_PERMISSIONS`, Sếp chỉnh được ở bảng quyền)

| Key | Nhãn | HR | Leader | Kế toán |
|---|---|---|---|---|
| `onboard.view` | Xem ngày đi làm & checklist onboard | ✓ | ✓ | ✓ |
| `onboard.edit` | Tích checklist onboard, sửa ngày đi làm | ✓ | ✗ | ✓ |
| `onboard.template` | Sửa mẫu checklist onboard | ✓ | ✗ | ✗ |

- Tài khoản **vai Leader** (theo vai, như phạm vi Leader hiện có) có `onboard.view` tích được **chỉ** mục `leader: true`, và chỉ ở hồ sơ thuộc job mình phụ trách.
- Sếp luôn toàn quyền.
- Server kiểm quyền ở mọi route; phạm vi hồ sơ theo `loadScopedApplication` (`src/lib/hr-session.ts`) như các route /hr khác. Kế toán đã thấy mọi hồ sơ có `offer_status` (`hr-scope.ts`).
- Đủ điều kiện = `offer_status = 'accepted'` và `work_type` khác `'freelancer'` (null coi là đủ).

### API

- `GET /api/hr/applications/[id]/onboarding` (`onboard.view`) → `{ eligible, start: { date, confirmed }, items, progress: { done, total }, reminded }`. Không đủ điều kiện → `{ eligible: false }`.
- `PATCH /api/hr/applications/[id]/onboarding` → `{ item_id, done: boolean }` (tích/bỏ tích; `onboard.edit`, hoặc Leader + mục leader) hoặc `{ start_date: 'YYYY-MM-DD' | null }` (`onboard.edit`; gọi hàm dùng chung ở trên). Ghi người + giờ tích.
- `GET/PUT /api/hr/onboarding-template` (`GET`: `onboard.view`; `PUT`: `onboard.template`): sửa/đặt lại mặc định. Giới hạn: ≤ 30 mục, nhãn ≤ 200 ký tự, phải có ≥ 1 mục.
- `GET /api/hr/applications` (danh sách pipeline): thêm cho hồ sơ đủ điều kiện `onboarding: { start_date, confirmed, done, total }` (chỉ khi người xem có `onboard.view`) để thẻ hiện mà không gọi thêm. **Đọc theo lô** (không gọi `effectiveStartDate` từng thẻ): 1 query `referral_placements`, 1 query `offer_letters` **chỉ lấy `data->>startDate`** (thư có lương — tuyệt đối không select cả `data`), 1 query `hr_onboarding`; lỗi phần này → bỏ field, không làm hỏng danh sách.

### Giao diện

- **Thẻ ứng viên** (hồ sơ đủ điều kiện — thường nằm ở cột Offer, nhưng hiện ở bất cứ cột nào thẻ đang ở): dòng `🗓 Đi làm T2 23/11 · 3/9`; ngày đi làm đã qua 5 ngày làm việc mà chưa đủ → nhấn màu cảnh báo; đủ hết → `✅ Đã onboard`.
- **Hồ sơ → khối "Onboard"** (đặt ngay sau khối Offer, hiện khi đủ điều kiện): ngày đi làm (+ nhãn "dự kiến từ thư mời" nếu chưa xác nhận, ô sửa nếu có quyền), checklist chia 3 nhóm *Trước ngày đi làm / Ngày đầu / Cuối tuần đầu*, mỗi mục ô tích + "Phương · 10:12 20/11". Mục Leader có nhãn "Leader".
- Dòng "Ngày đi làm thực tế" trong mục *Hoa hồng giới thiệu* giữ nguyên (cùng dữ liệu) — không phá luồng hoa hồng.
- **Tab Mẫu mail** thêm mục "Checklist onboard" (như mục "Thư mời nhận việc"): danh sách sửa/thêm/xoá/kéo thứ tự, chọn giai đoạn, cờ "Leader tích được", Lưu / Về mặc định. Tab này chỉ vào được khi có `emails.templates`; mục hiện khi có thêm `onboard.template`. Server kiểm `stage` ∈ before/day1/week1, `leader` boolean; id mục mới = `crypto.randomUUID()`.
- Màu theo token `--hr-*` (Sáng/Tối), dùng lại component sẵn có (Group, ô tích, segmented).

### Nhắc việc

- Endpoint cron mới `GET /api/hr/onboarding/remind` (`requireCronOrHr`, header `x-hr-cron-key`), gọi từ workflow chạy 15 phút/lần sẵn có (`.github/workflows/hr-interview-remind.yml`, 07:00–21:45 giờ VN) — thêm 1 bước với `if: ${{ !cancelled() }}` (bước nhắc PV lỗi thì bước onboard vẫn chạy). Endpoint tự quyết theo giờ VN, chỉ gửi khi **≥ 08:00 giờ VN**:
  - `before`: vào ngày làm việc liền trước ngày đi làm (bỏ T7/CN; viết thêm hàm lùi ngày làm việc — `addWorkingDays` chỉ cộng tới). Chưa tính ngày lễ (Tết…) — chấp nhận ở bản này. Nội dung: "Ngày mai (T2 23/11) Nguyễn Thành Tài đi làm — còn N việc chuẩn bị: …" (liệt kê mục `before` chưa tích).
  - `day1`: đúng ngày đi làm. "Hôm nay Nguyễn Thành Tài ngày đầu đi làm — các việc ngày đầu: …".
  - `week1`: ngày đi làm + 4 ngày làm việc (= hết 5 ngày làm việc đầu tiên; bắt đầu T2 → T6 cùng tuần, bắt đầu T4 → T3 tuần sau). "Hết tuần đầu của Nguyễn Thành Tài — nhớ hỏi thăm" + các mục còn thiếu.
  - Mốc nào mà mọi mục của giai đoạn đó đã tích → bỏ, không gửi.
- Mỗi mốc gửi **1 lần cho 1 ngày đi làm** (`reminded[mốc].for_date`). Đổi ngày đi làm → các mốc chưa tới được nhắc lại theo ngày mới; mốc đã qua không gửi bù.
- Hồ sơ hết điều kiện (không còn `accepted`) hoặc đã tích đủ mọi mục → không nhắc nữa. Đã qua ngày của mốc (vd. hệ thống tắt cả ngày) → bỏ mốc đó, không gửi muộn.
- Người nhận: luật chung `candidateRecipients` với sự kiện mới `onboard_remind` (thêm vào `NotifyEvent` + `LEADER_EVENTS`) → Sếp + người support + Leader của job; chưa có người support → như luật hiện có (@everyone + mọi HR). Discord kênh HR (tag) + **web push** ("chuông app" = thông báo đẩy của app /hr; không có danh sách thông báo trong app) qua `dispatchCandidateNotify`; `pushPerm: 'onboard.view'`. Push theo luật sẵn có: người support nhận trực tiếp; người nhận theo vai cần `push.receive`.
- **Không có lương** trong mọi nội dung nhắc.

## Ràng buộc

- Next.js 16 App Router, Supabase (service client), Tailwind v4 token `--hr-*`; theo cách các route /hr hiện có làm (session cookie, `requireHrUser`, `loadScopedApplication`, chặn Origin cho POST/PATCH/PUT).
- Migration áp prod **trước** khi deploy code đọc bảng mới.
- Ngày theo giờ Việt Nam (dùng `vnDateString` / `addWorkingDays` trong `offer-letter.ts`).
- GitNexus impact trước khi sửa `candidateRecipients`, `effectiveStartDate`, route PATCH referrals, GET applications.

## Để builder tự quyết

- Tên component/file cụ thể, cách chia module thuần (lib) vs store (server).
- Kiểu UI kéo thứ tự trong mẫu (kéo thả hay nút lên/xuống).
- Chi tiết câu chữ Discord/push (giữ ý ở trên, không lương).

## Quyết định của em (sếp kiểm khi đọc)

- Checklist **chụp mẫu lúc tạo**; sửa mẫu không đổi người đang onboard.
- Không thêm mục riêng cho từng hồ sơ ở bản này.
- Nhắc chạy qua cron 15 phút có sẵn, gửi từ 08:00 giờ VN; mốc "cuối tuần đầu" = ngày đi làm + 4 ngày làm việc.
- Quá hạn mà chưa tích đủ: chỉ báo màu trên thẻ, **không** nhắc lặp lại.
- Freelancer không có onboard.
- Mẫu checklist sửa ở tab Mẫu mail, quyền `onboard.template` (HR có, Kế toán/Leader không).
- Kế toán sửa được ngày đi làm (kéo theo hạn hoa hồng) — xem mục Ngày đi làm.
- Ngày dự kiến từ thư mời vẫn nhắc; "Về ngày trên thư mời" thay cho xoá ngày.
- Bỏ mốc nhắc nếu mọi việc của giai đoạn đó đã tích.

## Nguồn

Builder check (subagent đọc doc + code, 2026-11-18): không thấy đường lộ lương; các chỗ lệch code đã sửa vào doc (vị trí `loadScopedApplication`, cron `!cancelled()`, xoá ngày = về thư mời, đọc lô cho danh sách, hàm lùi ngày làm việc, ghi đè jsonb đồng thời).
