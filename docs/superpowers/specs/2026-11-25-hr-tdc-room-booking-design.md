# Đặt phòng họp TDC từ lịch phỏng vấn /hr (TDG ↔ TDC) — thiết kế

Ngày: 2026-11-25 · Người yêu cầu: sếp · Trạng thái: chờ duyệt

## 1. Mục đích

HR của TD Games (TDG, `/hr` trên tdgamestudio.com) hẹn phỏng vấn **Offline** thì chọn luôn phòng họp
của TD Consulting (TDC, platform.tdconsulting.vn) và giờ kết thúc. Bấm **Lưu** là phòng được đặt thật
trên lịch phòng TDC — HR không phải sang TDC đặt tay, và không bao giờ có 2 lịch chồng giờ cùng phòng.

Thành công = 4 ca kiểm thử của sếp (mục 9) chạy đúng trên production.

## 2. Mục tiêu / Không làm / Thất bại nếu

**Mục tiêu**
- Chọn phòng + giờ kết thúc ngay trong form "Lịch phỏng vấn" khi chọn Offline; danh sách phòng lấy từ TDC,
  mỗi phòng ghi "Còn trống" / "Bận" theo khung giờ đang chọn.
- Lưu → TDC xác nhận → TDG hiện "Đã đặt phòng Hội An" dưới lịch, lưu mã booking.
- Sửa giờ/phòng → cập nhật **đúng booking cũ**; Huỷ lịch / chuyển Online / xoá vòng / xoá hồ sơ → trả phòng.
- Bấm Lưu hoặc Thử lại nhiều lần không tạo booking trùng.

**Không làm (đợt này)**
- Không gửi tên ứng viên hay dữ liệu hồ sơ sang TDC (chỉ tiêu đề kiểu "Phỏng vấn TD Games – 2D Artist").
- Không đổi nội dung mail mời ứng viên (mail vẫn dùng địa chỉ văn phòng như hiện tại).
- Không đặt lịch lặp, không mời người tham dự (attendee) bên TDC.
- TDC không gọi ngược sang TDG (người TDC huỷ booking của TDG trên lịch phòng → TDG chỉ biết khi mở lại
  form hoặc bấm kiểm tra; xem mục 7).

**Thất bại nếu**
- TDG giữ chìa khoá có quyền đọc dữ liệu khác của TDC (lương, nhân sự…).
- HR bấm Lưu thấy "Đã đặt phòng" mà lịch phòng TDC không có, hoặc có 2 lượt đặt.
- TDC lỗi/mất kết nối làm HR không lưu được lịch phỏng vấn nào (kể cả Online).

## 3. Ràng buộc

- Hai hệ thống, hai repo, hai Supabase khác nhau. Phiên làm việc TDG chỉ sửa repo TDG; phía TDC do bot TDC
  (@tdconsulting_platforms_bot) làm theo mục 5 của tài liệu này.
- TDC: đổi database chỉ deploy 22h–8h hoặc 12h thứ 7 → 24h chủ nhật (quy định TDC); migration qua
  `scripts/db-push.sh`, không qua MCP.
- TDC đã có: `room_rooms`, `room_bookings` với exclusion constraint `room_bookings_no_overlap` chặn chồng giờ
  khi `status='booked'`; trigger `room_bookings_before` ghi `booker_name`; lịch phòng hiển thị mọi booking.
- TDG: `interview_sessions` hiện chỉ có `scheduled_at`, `mode`, `meet_url`, `reminded_at` — chưa có giờ kết
  thúc/phòng. Lưu lịch qua `PATCH /api/hr/interviews/[id]`, xoá vòng qua `DELETE` cùng route; xoá hồ sơ qua
  `DELETE /api/hr/applications/[id]` và `/api/admin/applications/[id]` (cascade xoá interview_sessions).

## 4. Các cách đã cân nhắc (sếp chọn cách 1, TDC làm theo đặc tả — hướng (a))

1. **TDC mở 1 Edge Function riêng, xác thực bằng khoá bí mật dùng chung** — CHỌN. Chỉ làm 4 việc (xem phòng,
   đặt/sửa, huỷ, xem 1 booking). Lộ khoá chỉ ảnh hưởng đặt phòng. Chống trùng nhờ mã tham chiếu của TDG.
2. TDG giữ service-role key của Supabase TDC — loại: TDG đọc được toàn bộ dữ liệu TDC.
3. TDG đăng nhập TDC bằng tài khoản riêng rồi gọi RPC — loại: phải giữ mật khẩu + gia hạn phiên, dễ hỏng ngầm.

## 5. Phía TDC (giao cho bot TDC)

### 5.1 Migration `<YYYYMMDDHHMMSS>_room_external_booking.sql`
```sql
alter table public.room_bookings
  add column if not exists external_source text,   -- 'tdg'
  add column if not exists external_ref    text;   -- id buổi phỏng vấn bên TDG (uuid dạng text)
-- 1 buổi PV bên TDG chỉ có tối đa 1 booking đang hiệu lực
create unique index if not exists room_bookings_external_uq
  on public.room_bookings (external_source, external_ref) where status = 'booked';
```
RPC (security definer, `revoke all … from public, anon, authenticated`, chỉ `service_role` gọi):

- `room_external_upsert(p_source text, p_ref text, p_room uuid, p_start timestamptz, p_end timestamptz,
  p_title text, p_booker text) returns jsonb`
  - Kiểm tra phòng `active`; khung giờ hợp lệ (end > start, ≤ 24h, start > now() − 5 phút).
  - Có booking `status='booked'` cùng (source, ref) → `update` room_id/start_at/end_at/title của đúng dòng đó.
    Không có → `insert` (title, `is_private=true`, `booked_by=null`, `booker_name=p_booker`,
    note `'Đặt từ TD Games /hr'`, external_source/ref).
  - Trùng giờ (`exclusion_violation`) → `raise exception 'room_busy' using errcode='P0001'` — vì update/insert
    nằm trong 1 câu lệnh, booking cũ **giữ nguyên** khi giờ mới bị trùng.
  - Hai request đồng thời cùng ref → index unique bắt (`unique_violation`) → thử lại nhánh update 1 lần.
  - Trả `{booking_id, room_id, room_name, start_at, end_at}`.
- `room_external_cancel(p_source text, p_ref text) returns jsonb` — `update … set status='cancelled'` dòng
  booked cùng (source, ref); không có dòng nào vẫn trả `{ok:true, cancelled:0}` (gọi lặp vô hại).
- `room_external_rooms(p_start timestamptz, p_end timestamptz, p_source text, p_ref text) returns jsonb` —
  phòng `active` (id, name, location, capacity, sort) + `free boolean` cho khung giờ; booking của chính
  (source, ref) **không tính là bận** (để khi sửa lịch, phòng đang giữ vẫn hiện "Còn trống").
- `room_external_get(p_source text, p_ref text) returns jsonb` — booking đang booked của ref (hoặc null) để
  TDG kiểm tra lại trạng thái.

Lưu ý trigger hiện có: `room_bookings_before` khi INSERT với `auth.uid()` null giữ `booked_by=null` và lấy
`booker_name` từ giá trị truyền vào → hiện "TD Games HR – <tên HR>" trên lịch. `room_bookings_cal` không tạo
sự kiện vì `attendee_ids` rỗng — kiểm lại khi viết.

### 5.2 Edge Function `room-external`
- Deploy `--no-verify-jwt` (gọi từ server TDG, không có JWT của TDC).
- Xác thực: header `x-tdg-key` so sánh **constant-time** với key `TDG_ROOM_API_KEY` đọc qua
  `_shared/appSecrets.ts` (admin nhập trong Cài đặt). Sai/thiếu → 401. Chỉ nhận `POST`, JSON.
- Body `{ action, ... }`, mọi action gọi RPC ở 5.1 bằng service role, `p_source = 'tdg'`:

| action | input | output 200 | lỗi |
|---|---|---|---|
| `rooms` | `start_at`, `end_at`, `ref?` | `{rooms:[{id,name,location,capacity,free}]}` | 400 giờ sai |
| `upsert` | `ref`, `room_id`, `start_at`, `end_at`, `title`, `booker` | `{booking_id, room_id, room_name, start_at, end_at}` | **409 `{code:"room_busy"}`**, 400 giờ/phòng sai |
| `cancel` | `ref` | `{ok:true, cancelled:n}` | — |
| `get` | `ref` | `{booking: {...} \| null}` | — |

- `title` cắt 200 ký tự; `booker` cắt 100. Log mỗi lệnh (action, ref, kết quả) để soi khi sai.
- Gửi cho TDG: URL function + giá trị `TDG_ROOM_API_KEY` (qua kênh riêng, không commit).

## 6. Phía TDG (em làm)

### 6.1 Database (migration mới)
`interview_sessions` thêm: `ends_at timestamptz`, `room_id text`, `room_name text`, `room_booking_id text`,
`room_state text check (room_state in ('booked','error','cancel_error'))`, `room_error text`.

### 6.2 Server
- `src/lib/tdc-rooms.ts`: client gọi `TDC_ROOM_API_URL` với `x-tdg-key: TDC_ROOM_API_KEY`, timeout 8 s.
  Thiếu env → tính năng **ẩn hoàn toàn** (form như cũ) — để TDG deploy trước khi TDC xong mà không hỏng gì.
- `GET /api/hr/interviews/[id]/rooms?start=&end=` → danh sách phòng + trống/bận (ref = id buổi PV).
- `PATCH /api/hr/interviews/[id]` (mở rộng, quyền `interviews.manage` như cũ):
  - Offline + có `room_id` → gọi `upsert` **trước** khi ghi DB TDG.
    - 409 `room_busy` → trả 409, **không ghi gì** (lịch + booking cũ giữ nguyên), client giữ form đang nhập.
    - Lỗi mạng/timeout/5xx → vẫn lưu lịch PV, `room_state='error'`, giữ room_id/room_name đã chọn để Thử lại.
    - OK → lưu `room_booking_id`, `room_name`, `room_state='booked'`.
  - Chuyển Online / Huỷ lịch / Offline nhưng bỏ chọn phòng → gọi `cancel(ref)`; lỗi → vẫn lưu lịch,
    `room_state='cancel_error'` để Thử lại trả phòng.
  - Offline bắt buộc có `ends_at` > `scheduled_at` (mặc định form = +60 phút). Online giữ `ends_at` nếu có, không bắt.
- `POST /api/hr/interviews/[id]/room-retry` → gọi lại upsert hoặc cancel theo `room_state`.
- `DELETE` vòng PV và `DELETE` hồ sơ (cả `/api/hr` lẫn `/api/admin`) → gọi `cancel` cho từng vòng có
  `room_booking_id` **trước** khi xoá; lỗi chỉ log + báo Discord, không chặn việc xoá.
- Tiêu đề gửi TDC: `Phỏng vấn TD Games – <tên job>`; booker: `TD Games HR – <tên người lưu>`.
- Thông báo Discord lịch PV thêm dòng "Phòng: Hội An" khi có.

### 6.3 Giao diện (`ScheduleBlock` trong `InterviewPanel.tsx`)
Khi chọn **Offline** trong form:
```
[25/11/2026 10:30]  đến [11:30]   (Offline | Online)
Phòng họp (TD Consulting)
  ( ) Phòng Hội An      ● Còn trống
  ( ) Phòng Đà Nẵng     ● Bận
  (•) Không đặt phòng
[Lưu lịch] [Huỷ]
```
- Danh sách tải lại khi đổi giờ (debounce). Phòng "Bận" không chọn được. Mặc định chọn phòng đang giữ
  (khi sửa) hoặc "Không đặt phòng" (lịch mới) — HR chủ động chọn.
- Sau khi lưu, dưới dòng lịch:
  - `booked` → "✓ Đã đặt phòng Hội An".
  - `error` → "Chưa đặt được phòng Hội An" + nút **Thử lại**.
  - `cancel_error` → "Chưa trả được phòng Hội An" + nút **Thử lại**.
  - 409 khi Lưu → báo ngay trong form: "Phòng đã có lịch trong khung giờ này. Vui lòng chọn giờ hoặc phòng khác."
- Nút Lưu / Thử lại khoá trong lúc chờ (chống bấm liên tiếp); chống trùng thật sự nằm ở `ref` phía TDC.

## 7. Trường hợp biên
- Người TDC tự huỷ booking của TDG trên lịch phòng: TDG không biết ngay. Mở form/vòng PV → gọi `get(ref)`;
  booking không còn → `room_state='error'` + "Phòng đã bị huỷ bên TDC — Thử lại". (Không cron đồng bộ.)
- Lịch đã qua: không cho đặt/sửa phòng cho giờ đã qua (TDC cũng chặn).
- Đổi giờ mà phòng cũ bận ở giờ mới: 409, giữ lịch + booking cũ (đúng yêu cầu sếp).
- Đổi phòng: cùng 1 lệnh upsert — booking cũ được chuyển phòng, không tạo booking mới.
- TDC đặt xong nhưng TDG ghi DB lỗi: booking tồn tại mà TDG chưa ghi nhận — lần Lưu/Thử lại sau gọi upsert
  cùng `ref` nên chỉ cập nhật đúng booking đó, không sinh booking thứ hai.

## 8. Thứ tự triển khai
1. TDG: làm + deploy trước, tính năng ẩn vì chưa có env (không ảnh hưởng HR).
2. Bot TDC: migration + RPC + Edge Function, deploy trong khung 22h–8h; gửi URL + key cho sếp.
3. Sếp (hoặc em) đặt env `TDC_ROOM_API_URL`, `TDC_ROOM_API_KEY` trên VPS TDG → restart → tính năng hiện.
4. Chạy 4 ca kiểm thử (mục 9) với tài khoản HR thử, dữ liệu thử xoá sau.

## 9. Kiểm thử (theo sếp)
1. TDG tạo PV Offline thứ Tư 25/11 10:30–11:30, chọn Hội An → booking xuất hiện ngay trên lịch Hội An ở TDC.
2. Đặt thêm 1 lịch chồng giờ cùng phòng → TDG báo phòng bận, TDC chỉ có 1 lượt đặt.
3. Đổi sang khung giờ trống → booking cũ được cập nhật, khung giờ cũ được giải phóng.
4. Chuyển Online hoặc huỷ trên TDG → phòng được giải phóng trên TDC.
Thêm: bấm Lưu 2 lần liên tiếp / Thử lại sau lỗi mạng → TDC vẫn chỉ 1 booking.

## 10. Quyết định em tự chốt (sếp xem lại)
- Lỗi kết nối khi đặt phòng: **vẫn lưu lịch PV**, đánh dấu "Chưa đặt được phòng" + Thử lại (để TDC sập không
  chặn HR hẹn lịch). Riêng phòng bận thì **không lưu gì**.
- Chọn phòng ngay trong form lịch (theo mô tả chữ), không làm nút "Đặt phòng" + hộp thoại riêng như ảnh minh hoạ.
- Mặc định "Không đặt phòng" khi tạo lịch mới; giờ kết thúc mặc định +60 phút.
- Booking bên TDC để riêng tư (link công khai của phòng chỉ hiện "Đã có lịch").
