# Đặt phòng họp TDC từ lịch phỏng vấn /hr (TDG ↔ TDC) — thiết kế

Ngày: 2026-11-25 · Người yêu cầu: sếp · Trạng thái: **bản 2 (hướng DB trực tiếp), chờ duyệt**

> Bản 1 (Edge Function `room-external` do bot TDC làm) bị sếp chê cồng kềnh → bỏ. Bản 2: sếp cấp chuỗi kết nối
> Postgres TDC, em tự làm cả 2 phía; TDG gọi RPC của TDC bằng anon key + mật mã riêng.

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
- Không đổi nội dung mail mời ứng viên.
- Không đặt lịch lặp, không mời người tham dự (attendee) bên TDC → không sinh sự kiện lịch/thông báo bên TDC.
- TDC không gọi ngược sang TDG (xem mục 7).

**Thất bại nếu**
- Máy chủ TDG (VPS) giữ thứ gì đọc được dữ liệu khác của TDC (lương, nhân sự…). Chuỗi kết nối Postgres TDC
  **chỉ nằm trên máy Mac** (`.env.local`, đã gitignore) để chạy migration — không bao giờ lên VPS/code.
- HR bấm Lưu thấy "Đã đặt phòng" mà lịch phòng TDC không có, hoặc có 2 lượt đặt.
- TDC lỗi/mất kết nối làm HR không lưu được lịch phỏng vấn nào (kể cả Online).

## 3. Hiện trạng đã kiểm (đọc DB TDC 2026-11-25, chỉ đọc)

- `room_rooms`: hiện **1 phòng** active — "Phòng Hội An" (Văn phòng TD Consulting). Cột `active`, `sort`.
- `room_bookings`: exclusion `room_bookings_no_overlap` (cùng phòng, `[start,end)` chồng nhau, khi
  `status='booked'`); check `end>start`, ≤ 24h, title 1–200 ký tự; `status in ('booked','cancelled')`.
  RLS chỉ cho `authenticated` thuộc team → anon không đụng được bảng.
- Trigger `room_bookings_before`: INSERT mà `auth.uid()` null (gọi qua anon) → giữ `booked_by=null`, lấy
  `booker_name` từ giá trị truyền vào; UPDATE tự ghi `cancelled_at`. `room_bookings_cal`: `attendee_ids` rỗng
  → không tạo `cal_events`, không gửi thông báo. Đã có 2 booking `booked_by=null` (hợp lệ).
- TDC recruit tự đặt Phòng Hội An khi gửi thư mời PV (`rec_iv_room_auto`); trùng giờ → TDC báo HR TDC
  "phòng đã có lịch". Booking của TDG giữ chỗ thì TDC cũng được báo như vậy — đúng ý "không chồng giờ".
- TDC: repo `TDSolutionsHN/tdc_platforms`; migration ghi ở `supabase_migrations.schema_migrations`
  (mới nhất 20261125220000); đổi DB chỉ trong **22h–8h** hoặc 12h T7 → 24h CN. Extension `pgcrypto`,
  `btree_gist` ở schema `extensions`.
- TDG: `interview_sessions` hiện chỉ có `scheduled_at`, `mode`, `meet_url`, `reminded_at`.

## 4. Cách chọn

TDG gọi **4 RPC** của TDC qua REST công khai của Supabase TDC (`/rest/v1/rpc/...`) bằng **anon key** (vốn
công khai trong web TDC) + **mật mã riêng** (chuỗi ngẫu nhiên 32 byte). TDC chỉ lưu **băm SHA-256** của mật mã.
Mỗi RPC kiểm mật mã trước tiên; sai → từ chối. Anon key không mở được bảng nào khác vì RLS TDC đã chặn anon.

Lộ mật mã → người ngoài chỉ đặt/huỷ được booking **do TDG tạo** (nguồn `tdg`), không đọc được dữ liệu khác;
đổi mật mã = cập nhật 1 dòng băm bên TDC + env TDG.

Đã loại: service-role key TDC trên TDG (đọc được mọi thứ); Edge Function + bot TDC (bản 1, cồng kềnh).

## 5. Phía TDC (em làm, migration commit vào repo TDC)

File `supabase/migrations/<YYYYMMDDHHMMSS>_room_external_booking.sql` (bản nháp giữ trong repo TDG ở
`docs/tdc/`), commit vào `TDSolutionsHN/tdc_platforms` qua GitHub API (không clone), chạy bằng `psql` trong
khung 22h–8h, rồi ghi `supabase_migrations.schema_migrations` đúng như `db push` để lịch sử TDC khớp.

```sql
alter table public.room_bookings
  add column if not exists external_source text,   -- 'tdg'
  add column if not exists external_ref    text;   -- id buổi phỏng vấn bên TDG
create unique index if not exists room_bookings_external_uq
  on public.room_bookings (external_source, external_ref) where status = 'booked';

create table public.room_external_clients (       -- 1 dòng cho TDG
  source text primary key, key_hash text not null, booker_prefix text not null,
  active boolean not null default true, created_at timestamptz not null default now());
alter table public.room_external_clients enable row level security;   -- không policy ⇒ chỉ RPC đọc được
revoke all on public.room_external_clients from anon, authenticated;
```

RPC — `security definer`, `set search_path = ''`, `grant execute … to anon`, revoke khỏi `public`:

| RPC | Việc | Trả |
|---|---|---|
| `room_ext_rooms(p_key, p_start, p_end, p_ref)` | phòng active + `free` theo khung giờ; booking của chính ref **không tính bận** | `[{id,name,location,capacity,free}]` |
| `room_ext_upsert(p_key, p_ref, p_room, p_start, p_end, p_title, p_booker)` | có booking booked cùng (tdg, ref) → **update** đúng dòng đó; chưa có → insert (`is_private=true`, note "Đặt từ TD Games /hr") | `{booking_id, room_id, room_name, start_at, end_at}` |
| `room_ext_cancel(p_key, p_ref)` | `status='cancelled'` dòng booked của ref; không có vẫn OK | `{cancelled: n}` |
| `room_ext_get(p_key, p_ref)` | booking booked của ref hoặc null | `{booking}` |

- Kiểm mật mã: `encode(extensions.digest(p_key,'sha256'),'hex') = key_hash and active`; sai → lỗi `unauthorized`.
- Upsert kiểm: phòng active, `end > start`, ≤ 24h, `start > now() − 5 phút`; title cắt 200, booker cắt 100
  (`booker_name = booker_prefix || p_booker`, vd "TD Games HR – Thảo").
- Trùng giờ (`exclusion_violation`) → lỗi `room_busy`; vì update là 1 câu lệnh nên **booking cũ giữ nguyên**.
- 2 lệnh đồng thời cùng ref → index unique bắt → thử lại nhánh update 1 lần.
- RPC chỉ sửa được dòng `external_source='tdg'` — không chạm booking của người TDC.
- Thêm 1 đoạn ngắn vào `CLAUDE.md` của TDC (bảng app Phòng họp) để bot TDC biết booking nguồn `tdg`
  và đừng xoá các cột/RPC này.

Mật mã: em sinh trên máy, chỉ đưa băm vào DB TDC (lệnh `insert` dữ liệu, không nằm trong file migration).

## 6. Phía TDG (em làm)

### 6.1 Database (migration mới)
`interview_sessions` thêm: `ends_at timestamptz`, `room_id text`, `room_name text`, `room_booking_id text`,
`room_state text check (room_state in ('booked','error','cancel_error'))`, `room_error text`.

### 6.2 Server
- `src/lib/tdc-rooms.ts`: `fetch` tới `${TDC_SUPABASE_URL}/rest/v1/rpc/room_ext_*` với header
  `apikey`/`Authorization: Bearer <TDC_SUPABASE_ANON_KEY>`, body có `p_key = TDC_ROOM_KEY`, timeout 8 s.
  Lỗi `room_busy` → `RoomBusyError`. Thiếu 1 trong 3 env → tính năng **ẩn hoàn toàn** (form như cũ).
- `GET /api/hr/interviews/[id]/rooms?start=&end=` → danh sách phòng + trống/bận (ref = id buổi PV).
- `PATCH /api/hr/interviews/[id]` (mở rộng, quyền `interviews.manage` như cũ):
  - Offline + có `room_id` → gọi upsert **trước** khi ghi DB TDG.
    - `room_busy` → trả 409, **không ghi gì** (lịch + booking cũ giữ nguyên), client giữ form đang nhập.
    - Lỗi mạng/timeout/5xx → vẫn lưu lịch PV, `room_state='error'`, giữ room_id/room_name để Thử lại.
    - OK → lưu `room_booking_id`, `room_name`, `room_state='booked'`.
  - Chuyển Online / Huỷ lịch / bỏ chọn phòng → `cancel(ref)`; lỗi → vẫn lưu lịch, `room_state='cancel_error'`.
  - Offline + có phòng bắt buộc `ends_at > scheduled_at` (form mặc định +60 phút).
- `POST /api/hr/interviews/[id]/room-retry` → gọi lại upsert hoặc cancel theo `room_state`.
- `DELETE` vòng PV và `DELETE` hồ sơ (cả `/api/hr` lẫn `/api/admin`) → `cancel` từng vòng có booking
  **trước** khi xoá; lỗi chỉ log + báo Discord, không chặn việc xoá.
- Tiêu đề gửi TDC: `Phỏng vấn TD Games – <tên job>`; booker: tên người lưu lịch.
- Thông báo Discord lịch PV thêm dòng "Phòng: Hội An" khi có.

### 6.3 Giao diện (`ScheduleBlock` trong `InterviewPanel.tsx`)
Khi chọn **Offline** trong form:
```
[25/11/2026 10:30]  đến [11:30]   (Offline | Online)
Phòng họp (TD Consulting)
  ( ) Phòng Hội An      ● Còn trống
  (•) Không đặt phòng
[Lưu lịch] [Huỷ]
```
- Danh sách tải lại khi đổi giờ (debounce). Phòng "Bận" không chọn được. Mặc định chọn phòng đang giữ
  (khi sửa) hoặc "Không đặt phòng" (lịch mới).
- Sau khi lưu, dưới dòng lịch: `booked` → "✓ Đã đặt phòng Hội An"; `error` → "Chưa đặt được phòng Hội An"
  + **Thử lại**; `cancel_error` → "Chưa trả được phòng Hội An" + **Thử lại**.
- 409 khi Lưu → báo trong form: "Phòng đã có lịch trong khung giờ này. Vui lòng chọn giờ hoặc phòng khác."
- Nút Lưu / Thử lại khoá trong lúc chờ; chống trùng thật sự nằm ở ref + index unique phía TDC.

## 7. Trường hợp biên
- Người TDC tự huỷ booking của TDG: mở form/vòng PV → `get(ref)`; không còn → `room_state='error'` +
  "Phòng đã bị huỷ bên TDC — Thử lại". (Không cron đồng bộ.)
- Lịch đã qua: không đặt/sửa phòng cho giờ đã qua (TDC cũng chặn).
- Đổi giờ mà phòng cũ bận ở giờ mới: 409, giữ lịch + booking cũ.
- Đổi phòng: cùng 1 lệnh upsert — booking cũ được chuyển phòng, không tạo booking mới.
- TDC đặt xong nhưng TDG ghi DB lỗi: lần Lưu/Thử lại sau gọi upsert cùng ref → chỉ cập nhật đúng booking đó.

## 8. Thứ tự triển khai
1. TDG: làm + deploy trước, tính năng ẩn vì chưa có env (không ảnh hưởng HR).
2. TDC (trong 22h–8h): commit migration vào repo TDC → chạy `psql` → ghi lịch sử migration → thêm dòng băm
   mật mã → gọi thử 4 RPC bằng anon key (kể cả mật mã sai phải bị từ chối).
3. Đặt env `TDC_SUPABASE_URL`, `TDC_SUPABASE_ANON_KEY`, `TDC_ROOM_KEY` trên VPS TDG → restart → tính năng hiện.
4. Chạy 4 ca kiểm thử (mục 9) với lịch thử, xoá/huỷ dữ liệu thử sau.

## 9. Kiểm thử (theo sếp)
1. TDG tạo PV Offline 10:30–11:30, chọn Hội An → booking xuất hiện ngay trên lịch Hội An ở TDC.
2. Đặt thêm 1 lịch chồng giờ cùng phòng → TDG báo phòng bận, TDC chỉ có 1 lượt đặt.
3. Đổi sang khung giờ trống → booking cũ được cập nhật, khung giờ cũ được giải phóng.
4. Chuyển Online hoặc huỷ trên TDG → phòng được giải phóng trên TDC.
Thêm: bấm Lưu 2 lần liên tiếp / Thử lại sau lỗi mạng → TDC vẫn chỉ 1 booking.

## 10. Quyết định em tự chốt (sếp xem lại)
- Lỗi kết nối khi đặt phòng: **vẫn lưu lịch PV**, đánh dấu "Chưa đặt được phòng" + Thử lại. Phòng bận thì
  **không lưu gì**.
- Chọn phòng ngay trong form lịch, mặc định "Không đặt phòng"; giờ kết thúc mặc định +60 phút.
- Booking bên TDC để riêng tư (link công khai của phòng chỉ hiện "Đã có lịch").
- Anon key TDC lấy từ web TDC (công khai) — không cần sếp gửi.
