# Ứng viên trùng / nộp lại — Design

Ngày: 2026-11-03 · Sếp hỏi "/hr không có luồng check ứng viên trùng à" → chốt qua chat.

## Vì sao
Hiện `POST /api/applications` insert thẳng, không so với hồ sơ cũ. Một người nộp lại = hồ sơ mới tinh,
báo Discord/Telegram như ứng viên mới, HR không biết người này từng trượt. Ca thật sếp nêu: A refer ứng
viên → trượt bài test → vài ngày sau B refer đúng người đó lại. Hệ quả: HR tốn công xét lại người vừa
loại, và quyền hoa hồng giới thiệu không rõ thuộc A hay B (dễ thành "nhặt ứng viên trượt để refer lại").

## Sếp đã nói (nguyên ý)
- Cửa sổ **6 tháng**.
- Nộp lại **đúng vị trí đã trượt** trong 6 tháng → **hệ thống tự reject luôn** (không chỉ gợi ý).
  Vị trí khác → xét bình thường.
- Ứng viên nhận **mail từ chối lịch sự**: "bạn đã apply vị trí này trước đó; có thắc mắc liên hệ người
  bạn đã apply qua lần trước".
- Quyền giới thiệu giữ cho **người giới thiệu đầu tiên trong 6 tháng**.
- **Người giới thiệu mới (B) phải được biết** (trực tiếp, hoặc HR biết để báo lại B).
- Báo team kiểu "nhẹ" (em đề xuất, sếp OK): kênh HR 1 tin không tag; không Telegram; không push cho đơn auto-reject trừ người được báo ở mục 5.

## Mục tiêu / không làm / thất bại nếu
- Mục tiêu: HR luôn thấy một người đã từng nộp gì, kết quả ra sao; người trượt không chiếm thời gian HR
  lần 2 trong 6 tháng; hoa hồng không bị chuyển chủ do refer lại.
- Không làm: chặn ở form (ứng viên vẫn nộp được, đơn vẫn lưu); gộp/merge hồ sơ; so trùng theo tên hay CV;
  công cụ dọn trùng dữ liệu cũ hàng loạt.
- Thất bại dù chạy được: reject nhầm người khác (trùng nhầm); reject người ở trạng thái "Lưu hồ sơ";
  ứng viên nhận cả mail "Cảm ơn ứng tuyển" lẫn mail từ chối; mail/tin cho B lộ ai refer trước, lý do
  trượt, điểm test; người không có quyền `apps.view_notes` thấy mã ref qua tính năng mới.

## Thiết kế

### 1. Nhận diện cùng một người
Đơn mới khớp hồ sơ cũ khi **email trùng** (trim + lower-case) **hoặc SĐT trùng** sau chuẩn hoá
(chỉ giữ chữ số; `84xxxxxxxxx` → `0xxxxxxxxx`; bỏ qua SĐT < 9 chữ số). Không dùng tên.
- Hàm thuần `normalizeEmail` / `normalizePhone` + `findPriorApplications(newApp, rows)` trong
  `src/lib/hr-duplicates.ts`, có test (`node --test` như các `*.test.ts` khác).
- Truy vấn DB: *(em chọn)* thêm 2 cột sinh sẵn `email_norm`, `phone_norm` (generated column hoặc
  ghi lúc insert + backfill trong migration) có index, để tìm nhanh và đúng; tránh `ilike` (ký tự `_`).

### 2. Phân loại đơn mới
So với các hồ sơ cũ khớp (mọi job), theo thứ tự ưu tiên:
1. **Auto-reject** — có hồ sơ cũ **cùng email** (không tính khớp chỉ SĐT), **cùng vị trí**, status
   `rejected`, ngày trượt **≤ 6 tháng** trước.
2. **Trùng đang xử lý** — có hồ sơ cũ cùng vị trí, status kind `open` (New…Interview).
3. **Ứng viên cũ** — mọi trường hợp khớp khác (vị trí khác; `talent_pool`; `offer`; rejected > 6 tháng).
4. Không khớp → như hiện nay.

- "Cùng vị trí": *(em chọn)* cùng `job_id`, **hoặc** job khác có tiêu đề giống hệt (trim, không phân biệt
  hoa thường) — vì job hay được đăng lại thành bản ghi mới.
- "Ngày trượt": hiện DB **không lưu thời điểm đổi status**. *(Em chọn)* thêm cột
  `applications.status_changed_at` (cập nhật mỗi lần đổi status ở mọi API đổi status). Dữ liệu cũ đang
  `rejected` mà chưa có giá trị → dùng ngày gửi mail `rejection` gần nhất trong `candidate_emails` nếu có,
  không thì `created_at` của hồ sơ cũ. Backfill trong migration theo đúng luật này.
- `talent_pool` ("Lưu hồ sơ") **không bao giờ** gây auto-reject.

### 3. Lưu đơn
Đơn luôn được insert (giữ lịch sử). Thêm cột:
- `duplicate_of uuid null references applications(id) on delete set null` — hồ sơ cũ khớp quan trọng nhất
  (ưu tiên: hồ sơ gây auto-reject → hồ sơ cùng vị trí mới nhất → hồ sơ mới nhất).
- `duplicate_kind text null check in ('auto_rejected','open_duplicate','returning')`.
- Auto-reject: `status = 'rejected'`, `rejection_reason = "Tự động: nộp lại trong 6 tháng sau khi trượt
  (hồ sơ cũ ngày dd/mm/yyyy)"`, `status_changed_at = now()`.
- Lỗi khi tra trùng (DB lỗi, migration chưa áp) → **nhận đơn như bình thường**, log lỗi; không bao giờ
  làm hỏng việc nộp đơn.

### 4. Quyền giới thiệu (6 tháng cho người đầu tiên)
- "Người giới thiệu đầu tiên" = `referred_by` của hồ sơ cũ khớp **email**, **sớm nhất** có `referred_by` khác rỗng và
  `created_at` ≤ 6 tháng trước đơn mới (mọi job).
- Nếu có và khác mã đơn mới nộp → đơn mới lưu `referred_by` = **mã người đầu tiên**; mã thật được nhập
  lưu vào cột mới `referred_by_submitted text null` (chỉ để tra cứu, cùng nhóm quyền `apps.view_notes`
  trong `hr-scope.ts`). Hoa hồng hiện tính theo `applications.referred_by` (`referral-store.ts`) nên tự
  đúng người, không sửa luật hoa hồng.
- Người phụ trách (assignee) của đơn mới: *(em chọn)* người phụ trách hồ sơ cũ khớp (nếu còn hoạt động và
  xem được đơn mới theo `autoAssigneeFor`), không thì theo luật hiện có. Lý do: người đó nắm lịch sử.
- Đơn **không** auto-reject nhưng bị chuyển quyền giới thiệu (vd. B refer vị trí khác trong 6 tháng)
  → B cũng được báo như mục 5, nội dung "Ứng viên đã được giới thiệu trước đó, hồ sơ vẫn được xét; hoa
  hồng (nếu có) thuộc người giới thiệu trước". *(em chọn — để B không tưởng mình được tính)*

### 5. Báo tin
**Ứng viên (auto-reject):** không gửi mail "Cảm ơn ứng tuyển". Gửi mail mẫu mới `kind = 'duplicate_rejection'`
(sửa được trong cài đặt mẫu mail như các kind khác, `hr-email-base.ts` / `hr-email-templates.ts`), gửi
tự động nền (`after()`), theo đúng cơ chế an toàn của auto-ack (bật/tắt chung công tắc auto-ack,
hàng đợi tuần tự, trần/giờ, giới hạn IP, đặt chỗ `candidate_emails` trước khi gửi).
- Nội dung mặc định: cảm ơn; bạn đã ứng tuyển vị trí {vi_tri} ngày {ngay_ung_tuyen_truoc} và đã nhận kết quả;
  có thể ứng tuyển lại vị trí này từ {ngay_duoc_nop_lai} (= ngày trượt + 6 tháng); có thắc mắc cứ trả lời
  mail này. Nếu hồ sơ cũ có người giới thiệu (tên hiển thị được tra ra từ mã: tài khoản /hr hoặc
  `referrers.name`) → thêm câu "bạn đã ứng tuyển qua giới thiệu của {nguoi_gioi_thieu_truoc}". Không
  bao giờ có chữ "trượt", lý do, điểm.
- From/Reply-To: theo **người phụ trách hồ sơ cũ** (fallback hiring@), như `replyToFor`.
- Đơn "trùng đang xử lý" / "ứng viên cũ": mail "Cảm ơn ứng tuyển" như hiện nay (dedupe 24h sẵn có vẫn áp).

**Người giới thiệu mới B** (khi auto-reject, hoặc khi bị chuyển quyền ở mục 4; chỉ khi mã B ≠ mã người đầu tiên):
- B là **tài khoản /hr** (mã khớp `hr_users.ref_codes`, chưa khoá): Discord tag + push riêng cho B.
  Nội dung auto-reject: "🔁 Ứng viên {tên} bạn giới thiệu cho {vị trí} đã ứng tuyển vị trí này ngày dd/mm
  và chưa phù hợp. Hệ thống đã tự động từ chối và gửi mail lịch sự. Có thể giới thiệu lại từ dd/mm."
  Không nêu người refer trước, lý do, điểm.
- B **không có tài khoản** (referrer ngoài, hoặc mã lạ): tag **người phụ trách đơn mới** (không có → như
  luật "chưa giao" hiện tại) kèm "Người giới thiệu: {tên/mã B} ({sđt}/{email} nếu có) — nhờ báo lại B".
  Hồ sơ có dòng **"Cần báo người giới thiệu"** + nút "Đã báo" (lưu `referrer_notified_at`,
  `referrer_notified_by`). Danh sách chờ báo thấy được như các nhắc việc khác *(em chọn: dùng chung
  `/api/hr/remind` nếu hợp, builder quyết cách hiển thị)*.

**Team:**
- Auto-reject: 1 tin Discord kênh HR **không tag ai**, không @everyone, **không Telegram**, không push
  (ngoài người ở trên): "🔁 Tự động từ chối: {tên} nộp lại {vị trí} — đã trượt dd/mm (link hồ sơ cũ). Đã
  gửi mail từ chối."
- Trùng đang xử lý: báo như đơn mới nhưng tiêu đề "🔁 Nộp trùng — đang xử lý ở hồ sơ cũ" + link.
- Ứng viên cũ: báo như đơn mới + dòng "Đã từng ứng tuyển: {vị trí} — {trạng thái} (dd/mm)".

### 6. Giao diện /hr
- Thẻ pipeline: badge "Tự động từ chối" / "Nộp trùng" / "Ứng viên cũ ×N".
- Modal ứng viên: mục **"Hồ sơ khác của người này"** — vị trí, ngày nộp, trạng thái, điểm AI; bấm mở hồ
  sơ đó. Chỉ liệt kê hồ sơ người xem **có quyền xem** (`canViewApplication` / scope hiện có); số hồ sơ bị
  ẩn hiện "+N hồ sơ bạn không có quyền xem" *(em chọn)*. Mã ref / `referred_by_submitted` chỉ hiện cho
  người có `apps.view_notes`.
- HR mở lại đơn auto-reject bằng cách đổi status như bình thường (không cần nút riêng).

## Sếp chốt 2026-11-03 (sau builder check, "OK theo đề xuất")
1. **Auto-reject chỉ khi trùng EMAIL.** Khớp chỉ qua SĐT → không bao giờ auto-reject; phân loại tối đa là
   "Ứng viên cũ" / "Trùng đang xử lý" (badge, HR tự quyết). Quyền giới thiệu (mục 4) cũng chỉ chuyển khi khớp EMAIL (em chỉnh 2026-11-03 theo security review: SĐT dễ đoán → nộp đơn giả để chiếm hoa hồng).
2. **Tự nộp lại không mã ref trong 6 tháng → vẫn tính cho A** (`referred_by` = mã A; `referred_by_submitted` = null).
3. **B có tài khoản nhưng không xem được hồ sơ mới** → vẫn tag Discord tên B, **không kèm link**; không push
   (push đòi quyền xem). Tin không chứa thông tin nhạy cảm nên an toàn.

## Chi tiết đã chốt sau builder check (em chọn, trừ khi ghi "sếp")
- **Không gia hạn 6 tháng bằng đơn auto-reject**: khi tính "ngày trượt"/"ngày được nộp lại", bỏ qua hồ sơ
  có `duplicate_kind = 'auto_rejected'` (nộp lại liên tục không đẩy mốc ra xa).
- "6 tháng" = 6 tháng lịch, theo ngày giờ Việt Nam.
- `status_changed_at`: trigger `BEFORE UPDATE OF status` trong DB (status đang được ghi ở ≥4 chỗ:
  `hr/applications/[id]`, `admin/applications/[id]`, `hr/jobs/[id]/close-out`, `hr/statuses` chuyển hàng loạt).
- So "B ≠ người đầu tiên" theo **chủ** của mã (qua `resolveRefOwner` + `referrers.ref_codes`), không so chuỗi
  — 2 mã alias của cùng người là một người.
- HR vẫn sửa được `referred_by` về sau (`hr/referrals/applications/[id]`); `referred_by_submitted` giữ nguyên.
- Câu "qua giới thiệu của …" trong mail = biến ra cả câu hoặc rỗng (như `cau_huy`, `doan_mbti`).
- Thực tế code cần lưu ý:
  - Tin "không tag" cho team gọi thẳng `discordNotify("hr", …)`, không qua `notifyCandidate` (luôn tag Sếp/
    assignee/@everyone).
  - Kind mail mới phải thêm vào CHECK `candidate_emails_kind_check`, `hr_email_templates_kind_check`, và
    `CANDIDATE_EMAIL_KINDS`/`KIND_LABEL`/`SYSTEM_ONLY_EMAIL_KINDS`/`KIND_VARS`/`DEFAULT_TEMPLATES`/
    `SAMPLE_DRAFT_INPUT`; cần index unique riêng (index chống trùng hiện chỉ cho `application_received`).
  - Cột mới phải khai trong `hr-scope.ts`: `duplicate_of`, `duplicate_kind` vào `BASE_FIELDS`;
    `referred_by_submitted`, `referrer_notified_*` và dòng "Cần báo người giới thiệu" thuộc `apps.view_notes`.
  - "Chờ báo B" không dùng `/api/hr/remind` (đó là cron hồ sơ open quá hạn) → bộ lọc/hiển thị riêng trên /hr.
  - Schema thật lệch migration (nhiều cột applications không có trong `supabase/migrations/`) → xem schema
    live trước khi viết migration.
  - Set `status: 'rejected'` sau `sanitizeApplicationInput`; cột tuỳ chọn chỉ ghi khi có giá trị (như
    `assignee_user_id`) để insert không vỡ khi migration chưa áp.

## Để builder tự quyết
Tên file/hàm cụ thể, cách join dữ liệu trong `/api/hr/applications`, câu chữ cuối của mail/tin (giữ ý
trên), migration cụ thể (theo `supabase/migrations/` hiện có), có cần RPC SQL hay làm trong JS.
