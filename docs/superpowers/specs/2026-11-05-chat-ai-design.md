# AI trả lời chat website — thiết kế (Phase A: nháp cho staff)

Sếp chốt 2026-11-05 (thảo luận trong phiên chat):
- Dùng lại cổng AI chấm CV (`AI_BASE_URL` / `AI_API_KEY`, cliproxyapi). Model chính `claude-sonnet-5-5`,
  lỗi → dự phòng `gpt-6.1-sol` (đã ping + eval 24/25). Lỗi → báo admin.
- Ngân sách tối đa ~$100/tháng.
- Áp cho cả khách và ứng viên.
- Đi theo pha: **A = nháp chỉ staff thấy** → B = AI tự trả lời ngoài giờ → C = 24/7 (người thật trả lời thì AI im,
  2h không ai trả lời thì AI tiếp).
- AI CHỈ trả lời từ dữ liệu công ty, không bịa.

## Phase A (đã làm)

**Luồng:** khách gửi tin text → `/api/chat/message` trả về ngay → `after()` gọi `draftReplyFor(thread, msg)`:
1. `chat_ai_mode` = `off` → thôi.
2. Chờ 6s (debounce). Nếu đã có tin khách mới hơn / staff đã trả lời → thôi (lần gọi sau lo).
3. Tin rác (`worthDrafting`: "ok", "thanks", emoji…) → thôi.
4. Trần: 15 nháp/luồng/24h; 300 nháp/24h toàn hệ thống (chạm → báo admin); ngân sách tháng (giờ VN)
   từ `chat_ai_drafts.cost_usd` ≥ `chat_ai_budget_usd` → báo admin, dừng.
5. Prompt = luật cứng + thẻ `chat_kb` (theo audience + "any", mã K1..) + job đang mở (J1..) + 14 tin gần nhất
   (bọc `<conversation>`, coi là DATA). Ra JSON `{answer, sources, needs_human, confidence}`.
6. Gọi model chính → lỗi / sai JSON → model dự phòng. Có lỗi → `alertAdmin` (chuông người có chat.manage +
   Discord kênh sales, gộp 1 lần/30 phút/loại). Cả 2 lỗi → lưu nháp `failed`.
7. `guardDraft` kiểm bịa: nguồn phải có thật; số / email / link trong câu trả lời phải có trong kho hoặc lời khách;
   nhắc "ORCA" (NDA) → cảnh báo. Có cảnh báo → ép `needs_human`.
8. Nháp cũ đang chờ → `superseded`; lưu nháp `pending` + token + chi phí ước tính ($2/$10 per MTok).

**Staff (/hr → Chat):** thẻ "🤖 Nháp AI" trên ô trả lời: nội dung, nguồn, cảnh báo, "cần người xem kỹ";
"Dùng nháp này" (chèn vào ô để sửa rồi gửi → `sent` + `edited`), "Bỏ", 👍/👎. Gửi tay → nháp `superseded`.
**🤖 AI** (chat.manage): bật/tắt, ngân sách, thống kê tháng, sửa kho kiến thức.

**Eval:** `node --env-file=.env.local scripts/chat-ai-eval.ts [model]` — 25 câu (cả câu bẫy giá, NDA, jailbreak).
2026-11-05: Sonnet 5.5 21/25 kỳ vọng ban đầu (4 lệch = gạt đi lịch sự, không bịa → đổi kỳ vọng "không bịa");
gpt-6.1-sol 24/25. ~$0.009/nháp → $100 ≈ 11k nháp.

## Phase C — tự trả lời 24/7 (ĐÃ LÀM 2026-11-06, sếp bỏ qua B, bật thẳng 24/7)
`chat_ai_mode` = `auto` (nút "Tự trả lời 24/7" trong /hr → Chat → 🤖 AI). Sau khi soạn nháp (`autoSend` trong chat-ai.ts):
- Đọc lại luồng: có tin khách mới hơn / staff hoặc AI đã trả lời sau tin đó → thôi. Staff trả lời luồng trong 2h qua → AI im (chỉ nháp).
- Nháp **không cảnh báo** → giành nháp (pending→sent, decided_by null = AI gửi) rồi gửi tin `sender='ai'`.
  `needs_human=false` → luồng "answered"; `true` → vẫn chờ người (câu trả lời đã nói "team sẽ liên hệ").
- Nháp **có cảnh báo** → khách nhận câu chờ cố định (EN / VI theo dấu tiếng Việt, 1 lần đến khi staff vào); nháp giữ cho staff.
- Widget: bong bóng "AI assistant", 3 chấm tối đa 60s sau tin khách (config `aiAuto`). /hr: tin AI nền xanh "🤖 AI tự trả lời".
- Chuông báo staff khi khách nhắn vẫn giữ như cũ. Tin AI không gửi mail.
- guardDraft: "1.000" (kiểu Việt) = "1,000" khi so số.
