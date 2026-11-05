# Chat trên website (khách + ứng viên) — thiết kế

Ngày: 2026-11-05 · Người quyết: sếp (Tony) · Trạng thái: **chờ sếp duyệt**
Mockup: `.superpowers/mockups/chat-widget.png` (phía khách), `.superpowers/mockups/chat-inbox.png` (phía app).
Mockup có vẽ AI. Giai đoạn 1 **bỏ toàn bộ phần AI** (xem §3).

## 1. Vì sao

Hiện khách chỉ liên hệ được qua form "Get a free quote" và email. Ứng viên muốn hỏi về job cũng không có kênh hỏi nhanh.
Sếp muốn có **một ô chat trên website** cho 2 nhóm người:

- **Khách (studio/publisher)**: hỏi nhanh về dịch vụ, giá, quy trình. **Sếp** trả lời.
- **Ứng viên**: hỏi về job, cách nộp, tình trạng hồ sơ. **HR** trả lời.

Người trả lời làm việc trên **điện thoại**, trong app **/hr** cài dạng PWA (đã có sẵn chuông báo đẩy và tài khoản riêng từng người).
Sếp lo /hr bị **loạn** khi thêm chat, vì mỗi khách là một luồng riêng. Vì vậy chat phải nằm ở **khu riêng**, không lẫn vào pipeline ứng viên.

## 2. Mục tiêu

1. Nút chat ở góc phải **mọi trang public** (trừ /admin, /hr, /crm).
2. Mở ra là có **các nút câu hỏi có sẵn** như Facebook. Bấm nút thì hiện ngay **câu trả lời soạn sẵn**.
   Sếp/HR **tự sửa** danh sách nút và câu trả lời trong app.
3. Khách gõ tự do hoặc bấm "Talk to a person" → **chuyển cho người thật**: điện thoại người phụ trách rung, người đó trả lời ngay trong app.
4. **Mỗi người = 1 luồng chat**, giữ lịch sử dù rời trang hoặc quay lại sau (§5).
5. **Giờ trực 8:00–22:00 giờ Việt Nam, mọi ngày** (sếp chốt). Ngoài giờ trực, muốn gặp người thật thì **bắt buộc để lại email**.
   Trong giờ trực thì email không bắt buộc (§4).
6. Trả lời lúc khách đã rời trang → gửi câu trả lời **qua email** kèm link "Continue the conversation" (sếp OK).
7. Trong app có **tab "Chat" riêng**, mặc định chỉ hiện các cuộc **cần người trả lời**.
8. Tạo **lead CRM** từ cuộc chat của khách bằng 1 chạm.

## 3. Ngoài phạm vi giai đoạn 1 / chống mục tiêu

- **AI tự trả lời: làm sau cùng** (sếp chốt). Giai đoạn 1 **không có AI** ở bất kỳ đâu: không tự trả lời, không gợi ý câu trả lời.
  Mô hình dữ liệu chừa chỗ để sau này bật AI 24/7 mà không phải làm lại: có vai người gửi `ai`, có công tắc `chat_ai_enabled` mặc định tắt.
  Code AI thì chưa viết.
- Không gửi file hay ảnh trong chat (giai đoạn 1 chỉ có chữ).
- Không chat qua Facebook, Zalo hay Telegram. Không tích hợp dịch vụ chat bên ngoài (Intercom, Crisp, Tawk).
- Không làm app native, chỉ dùng PWA /hr hiện có.
- **Chống mục tiêu (coi là thất bại dù chạy được):**
  - Chat làm rối các màn /hr hiện có.
  - Điện thoại rung liên tục vì tin rác.
  - Khách phải điền form trước khi hỏi được câu đầu tiên.
  - Ứng viên đọc được câu trả lời của khách khác (lộ dữ liệu giữa các luồng).
  - Bảo mật kém tới mức người ngoài đọc được lịch sử chat chỉ bằng cách đoán mã.

## 4. Phía khách — ô chat trên website

Ngôn ngữ ô chat: **tiếng Anh**, khớp website (em tự quyết). Giao diện theo mockup A1–A3, bỏ mọi chữ "AI".

- **Nút nổi** cam ở góc phải dưới. Lần đầu vào site, sau khoảng 8 giây hiện một bong bóng chào nhỏ một lần.
  Đã đóng thì không hiện lại trong 7 ngày (em tự quyết).
- **Mở ra** gồm: lời chào, các nút câu hỏi có sẵn và ô gõ.
  - Bấm nút → hiện ngay câu trả lời soạn sẵn. Vẫn ghi vào lịch sử luồng, nhưng **không** gọi người thật và **không** rung chuông.
  - Câu trả lời soạn sẵn có thể kèm **nút link** (ví dụ "Get a free quote" → /contact, "Open jobs" → /careers).
- **Gặp người thật** khi khách gõ tin tự do hoặc bấm "Talk to a person":
  - **Trong giờ trực:** tin được gửi ngay, header hiện "Usually replies in minutes".
    Sau tin đầu tiên, hiện khung nhỏ **không bắt buộc**: "Leave your name & email so we can reply even if you leave".
  - **Ngoài giờ trực:** ô chat báo "We're offline (8:00–22:00 Vietnam time). Leave your email and we'll reply by email."
    Khách **phải điền email** thì tin mới được gửi đi. Tên không bắt buộc.
  - "Trong giờ trực" chỉ tính theo đồng hồ 8:00–22:00 giờ Việt Nam. Giai đoạn 1 không có nút bật/tắt "trực tuyến" trong app (em tự quyết, cho đơn giản).
- **Phân loại khách hay ứng viên** (em tự quyết):
  - Bấm nút thuộc nhóm "Jobs" → ứng viên.
  - Không thì dựa vào trang đang xem: mở chat ở `/careers*` → ứng viên, còn lại → khách.
  - Người trong app đổi tay được (khách ↔ ứng viên). Đổi xong thì luồng chuyển sang người phụ trách tương ứng.
- **Tin mới từ team** hiện ngay trong ô chat đang mở (cập nhật trong vài giây).
  Ô chat đang đóng mà có tin mới → nút nổi hiện chấm đỏ.
- Mobile: ô chat chiếm gần toàn màn hình. Desktop: khung khoảng 380×600 ở góc phải.

## 5. Luồng chat: mỗi người một luồng

- Lần đầu khách mở chat, trình duyệt lưu một **mã khách ngẫu nhiên, đủ dài để không đoán được** (localStorage + cookie, khoảng 1 năm).
  Mã này là "chìa khoá" đọc luồng của chính khách đó. Server không bao giờ trả luồng nếu thiếu đúng mã.
- Rời trang, chuyển trang, đóng tab hay quay lại vài ngày sau → **vẫn là luồng cũ**, hiện đủ lịch sử.
- Khách nhắn lại vào luồng đã "Đóng" → luồng **mở lại** và nhảy lên nhóm "Cần người".
- **Đổi máy hoặc xoá trình duyệt** → sinh luồng mới. Nếu khách để lại **cùng email** với một luồng cũ, trong app hiện
  "Người này có 1 cuộc chat trước" kèm nút **Gộp**, người trả lời bấm mới gộp.
  Không tự gộp chỉ dựa trên email do khách tự gõ, vì gõ email người khác là đọc được lịch sử của họ (em tự quyết).
  **Gộp chỉ gộp phía app**: người trả lời thấy chung lịch sử. Trình duyệt khách **không** tự thấy lịch sử luồng cũ sau khi gộp,
  chỉ thấy khi mở link trong email đã gửi tới chính địa chỉ đó. Như vậy người gõ email của người khác không đọc trộm được.
- **Link trong email** "Continue the conversation" chứa một mã riêng của luồng. Bấm vào sẽ mở website kèm ô chat, gắn đúng luồng đó vào trình duyệt đang dùng (kể cả máy khác).
  Mã có hạn 30 ngày và được thay mới mỗi lần gửi email. Mở link thì trình duyệt đó nhận một mã khách mới cho luồng.
- **Quyền riêng tư:** dưới ô gõ có dòng nhỏ "By chatting you agree to our Privacy Policy" (link /privacy-policy). Trang /privacy-policy thêm một đoạn về chat.
  Dữ liệu chat (tin nhắn, email, trang đã xem, quốc gia, thiết bị) giữ **24 tháng** kể từ tin cuối rồi tự xoá.
  Khách xin xoá thì người trong app xoá được cả luồng (em tự quyết).

## 6. Phía app — tab "Chat" trong /hr

Thêm một view **"Chat"** vào thanh chuyển view hiện có của /hr (Pipeline, Freelancer, KPI…), có **badge đỏ** đếm số luồng cần người.
Mockup B1 vẽ thanh tab ở dưới chỉ để minh hoạ. Vị trí thật theo đúng thanh view hiện tại của /hr.

- **Danh sách (B1):**
  - Bộ lọc chính: **Cần người** (mặc định) · **Đã trả lời** · **Đã đóng**. Bộ lọc phụ: Tất cả · Khách · Ứng viên.
  - Mỗi dòng gồm: tên/email (chưa có thì hiện "Visitor #1234"), nhãn KHÁCH/ỨNG VIÊN, tin cuối, thời gian,
    trang đang xem, cờ quốc gia (đoán theo IP), chấm trạng thái.
  - **"Cần người"** = tin cuối là của khách **và** khách đã nhắn tự do hoặc bấm "Talk to a person". Luồng chỉ bấm nút câu hỏi có sẵn thì không tính.
- **Trong một luồng (B2):**
  - Toàn bộ tin nhắn. Tin bấm nút có sẵn hiện dạng "Khách bấm: Our services & pricing", kèm câu trả lời có sẵn đã hiện cho khách.
  - Thông tin khách: email, tên, các trang đã xem gần nhất, quốc gia, thiết bị.
  - Nút: **Gửi** · **Đóng** · **Đổi nhãn khách ↔ ứng viên** · **Tạo lead CRM** · **Gộp** (khi có luồng trùng email) · **Xoá luồng**.
  - **Tạo lead CRM** (chỉ với luồng khách, và chỉ khi luồng **đã có email**; chưa có email thì nút mờ, kèm gợi ý "Xin email khách trước"):
    tạo một dòng trong bảng `leads` hiện có, với `source = 'chat'`, `service = 'Chat inquiry'`, name là tên (không có thì lấy phần trước @ của email),
    message là các tin của khách ghép lại. Bảng `leads` giữ nguyên, không thêm cột. Liên kết hai chiều lưu ở `chat_threads.lead_id`.
    Luồng đã có lead thì nút đổi thành "Đã tạo lead".
  - Ứng viên trùng email với một hồ sơ trong `applications` → hiện link "Mở hồ sơ" (chỉ hiện link, không tự gắn dữ liệu).
    Link chỉ hiện với người **xem được hồ sơ đó** theo quyền /hr hiện có.
  - Không có nút "Tiếp nhận" như mockup, vì giai đoạn 1 không có AI để tiếp nhận lại.
- **Quản lý câu hỏi có sẵn:** một màn trong tab Chat (ví dụ nút ⚙ "Câu hỏi có sẵn").
  Thêm, sửa, xoá, sắp thứ tự nút. Mỗi nút gồm: nhãn, nhóm (khách/ứng viên/chung), câu trả lời (chữ thường, cho phép link),
  nút link tuỳ chọn, bật/tắt. Có **bộ câu mẫu** sẵn ban đầu để sếp sửa (em soạn theo nội dung site hiện có).
- **Quyền** (thêm vào `src/lib/hr-permissions.ts`):
  - `chat.candidates`: xem và trả lời luồng ứng viên. Mặc định bật cho HR.
  - `chat.clients`: xem và trả lời luồng khách. Mặc định chỉ sếp (boss luôn có đủ quyền).
  - `chat.manage`: sửa câu hỏi có sẵn và cài đặt chat. Mặc định chỉ sếp.

  Người không có quyền với loại luồng nào thì **không thấy** luồng loại đó, kể cả qua API.
- **Ai trả lời thì tên người đó hiện cho khách** (ví dụ "Tony · TD Games"), dùng tên hiển thị của tài khoản /hr.

## 7. Thông báo

- **Chuông báo đẩy** (dùng hạ tầng `hr-push` hiện có) gửi khi một luồng **chuyển sang "Cần người"**:
  - Luồng khách → người có `chat.clients`.
  - Luồng ứng viên → người có `chat.candidates`.

  Khách nhắn liên tiếp nhiều tin thì gom lại: một luồng chỉ báo **1 lần mỗi 5 phút** (em tự quyết).
  Ngoài giờ trực **vẫn báo** để sếp tự quyết có trả lời không. Nội dung báo: "Khách cần người: Alex 🇺🇸" + câu đầu của tin.
- **Email cho khách:** khi người trong app trả lời mà khách **không mở trang** (không còn kết nối trong khoảng 2 phút) và luồng **có email**,
  gửi email chứa câu trả lời và link "Continue the conversation".
  - Gom các tin trả lời liên tiếp thành 1 email. Tối đa 1 email mỗi 10 phút cho mỗi luồng (em tự quyết).
  - Gửi qua Resend (hạ tầng mail /hr). Luồng ứng viên gửi từ **`hiring@`**, theo quyết định sếp ngày 28/10: mail ra ngoài đi từ hiring@, còn hr@ chỉ dùng nội bộ.
    Luồng khách gửi từ **`info@`**. Resend xác thực theo cả tên miền tdgamestudio.com nên dùng chung được. Builder gửi thử một mail để kiểm.
  - Mail chat **đi theo công tắc `HR_EMAIL_MODE` hiện có**: chế độ test thì mọi mail chuyển về tony@, chế độ live thì gửi thật (prod hiện đang live).
    Đây là **mail tự động có chủ đích** (sếp OK ở bước thiết kế), khác với mail ứng viên gửi tay trong /hr.
  - Cuối mail có dòng "You received this because this address was entered in the chat on tdgamestudio.com", phòng khi khách gõ nhầm email người khác.
- Không gửi Discord/Telegram ở giai đoạn 1 (em tự quyết, tránh trùng với chuông báo).

## 8. Dữ liệu (Supabase, chỉ thêm bảng mới)

Em đề xuất, builder được chỉnh tên/kiểu nếu hợp lý hơn:

- `chat_threads`: id, visitor_token_hash (lưu bản băm, không lưu mã gốc), audience (`client` | `candidate`),
  status (`open` | `answered` | `closed`), needs_human (bool), name, email, country, user_agent, first_page, last_page,
  pages (mảng vài trang gần nhất), merged_into (id), lead_id (FK leads, null), email_link_token_hash, email_link_expires_at,
  last_visitor_seen_at, last_message_at, last_push_at, last_email_at, created_at, updated_at.
- `chat_messages`: id, thread_id, sender (`visitor` | `staff` | `system` | `ai`), staff_user_id (null nếu không phải staff),
  kind (`text` | `quick_reply` | `canned_answer` | `contact_form`), body, quick_reply_id, created_at.
- `chat_quick_replies`: id, label, audience (`client` | `candidate` | `any`), answer, link_label, link_url, sort_order,
  active, created_at, updated_at.
- `app_settings`: thêm `chat_ai_enabled` (mặc định false, chưa dùng), `chat_hours` (`{"tz":"Asia/Ho_Chi_Minh","start":"08:00","end":"22:00"}`),
  `chat_widget_enabled` (công tắc tắt ô chat trên toàn site).
- RLS bật, không có chính sách cho khách vãng lai. Mọi truy cập qua API server dùng service role (giống các bảng khác).

## 9. API

- **Công khai (ô chat):** tạo/lấy luồng theo mã khách, gửi tin, bấm câu hỏi có sẵn, gửi tên/email, lấy tin mới, lấy danh sách câu hỏi có sẵn và trạng thái giờ trực.
  - **Chống spam:** giới hạn theo IP và theo luồng (dùng `hr-rate-limit`), giới hạn độ dài tin (ví dụ 2.000 ký tự),
    chặn link hàng loạt. Tin nhắn rác không được làm rung chuông liên tục (đã có gom 5 phút ở §7).
  - Chưa có captcha ở giai đoạn 1 (em tự quyết). Nếu bị spam thật thì thêm Cloudflare Turnstile.
- **App (/hr):** liệt kê luồng theo quyền, đọc luồng, trả lời, đóng, đổi nhãn, gộp, tạo lead, CRUD câu hỏi có sẵn.
  Dùng phiên đăng nhập /hr hiện có (`hr-session`) và kiểm quyền §6.
- **Cập nhật gần như tức thì:** phía khách dùng **polling 3–5 giây** khi ô chat đang mở (chậm lại khi tab ẩn).
  Không dùng Supabase Realtime phía khách vì RLS không có chính sách công khai. Phía app thì builder chọn polling hoặc Realtime.
- **Việc chạy nền** (gom chuông 5 phút, email khi khách đã rời 2 phút, xoá dữ liệu quá 24 tháng):
  thêm route cron bảo vệ bằng khoá, theo đúng mẫu các route `remind` hiện có. Bộ giới hạn tốc độ trong bộ nhớ dùng được vì PM2 chạy 1 tiến trình.
- **Cờ quốc gia** lấy từ `cf-ipcountry` chỉ để hiển thị, có thể bị giả mạo nên không dùng cho bất kỳ quyết định nào.

## 10. Ràng buộc

- Next.js 16 App Router, Tailwind v4, Supabase, deploy PM2 trên VPS như hiện tại. Không thêm dịch vụ trả phí.
- Ô chat **không được làm chậm trang** đáng kể: tải lười (sau khi trang đã hiện, hoặc khi bấm nút), không chặn LCP.
- Không hiện ô chat ở /admin, /hr, /crm, /company-profile ở chế độ trình chiếu (Slides), và các trang in.
- Khách nhập gì thì hiện nguyên văn dạng chữ thường, không render HTML (chống chèn mã).
- Thời gian hiển thị trong app theo giờ Việt Nam.

## 11. Để builder quyết

Cấu trúc component, cách polling hay realtime, tên route cụ thể, cách băm mã, chi tiết UI ngoài mockup,
nội dung bộ câu hỏi mẫu ban đầu, cách đoán quốc gia (header Cloudflare `cf-ipcountry` nếu có).

## 12. Phần em tự quyết (sếp xem lại)

1. Ô chat tiếng Anh, app tiếng Việt.
2. Giờ trực chỉ theo đồng hồ 8–22h, chưa có nút bật/tắt "trực tuyến".
3. Không tự gộp luồng theo email, chỉ gợi ý gộp để người trả lời bấm (lý do bảo mật).
4. Phân loại khách/ứng viên theo nút bấm và trang đang xem, đổi tay được.
5. Chuông báo gom 1 lần / 5 phút / luồng, ngoài giờ vẫn báo. Email cho khách gom 1 lần / 10 phút.
6. Email khách gửi từ `info@`, email ứng viên gửi từ `hiring@` (theo quyết định 28/10). Mail chat đi theo công tắc test/live `HR_EMAIL_MODE`.
7. Chưa có captcha, thêm Turnstile khi bị spam.
8. Không báo Discord/Telegram ở giai đoạn 1.
9. Tạo lead CRM chỉ khi luồng đã có email, `service = 'Chat inquiry'`, bảng `leads` không đổi.
10. Dữ liệu chat giữ 24 tháng rồi tự xoá, có dòng Privacy Policy dưới ô chat, có nút xoá luồng theo yêu cầu khách.
11. Quyền `chat.*` mặc định tắt cho Leader và Kế toán. Chuông chỉ gửi người có quyền chat **và** `push.receive`.
