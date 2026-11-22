# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-11-21 — Ads tiêu nhanh / gần hết tiền
- Sheet KHÔNG cập nhật từ 20/11 15:11 UTC → script v2 chưa chạy hằng giờ (chưa đặt tần suất hoặc lần chạy theo lịch bị lỗi); 71 lệnh đợt 1 vẫn PENDING, phủ định CHƯA áp dụng.
- GA4 (chi phí nhập từ Ads, USD): 20/11 29 hiển thị / 4 click / 12,84 USD (~330k₫); 21/11 (chưa hết ngày) 43 / 7 / 12,31 USD (~315k₫). Tiêu ~2× ngân sách 165k mỗi ngày: Google cho phép tới 2×/ngày và đang bù cho nửa đầu tháng chi thiếu (giới hạn tháng = 30,4 × ngân sách ngày ≈ 5tr) → cuối tháng 11 có thể vẫn ~330k/ngày. 1tr nạp 20/11 gần hết.
- Chất lượng: 11 click / 7 phiên GA4, 2 phiên tương tác; Mỹ 2–6 giây, Thổ Nhĩ Kỳ 1 phiên dài ~5 phút; 0 lead. Tất cả vào /services/2d-animation.
- Đã báo sếp: kiểm tần suất + lịch sử chạy script; quyết định ngân sách (đề xuất hạ ngân sách ngày ~85k cho hết tháng 11 nếu muốn thực chi ~165k/ngày, hoặc tạm dừng tới khi phủ định áp dụng).
- (tiếp) Sếp chọn A: hạ ngân sách ngày Animation 165k → 85k tới hết 11/2026 (thực chi ~165k/ngày do Google chi bù tới 2×), 1/12 đặt lại 165k. Sếp tự đổi trong giao diện (ngoài quyền script). Script vẫn chưa chạy lại (Sheet 20/11 15:11 UTC, 71 lệnh PENDING) → đã hướng dẫn kiểm tần suất / chạy tay.
- (tiếp) Sếp đặt Hằng giờ + chạy tay → Sheet 21/11 12:46 UTC, 71/71 lệnh DONE: chiến dịch có 60 phủ định, 19 từ khoá (6 RARELY_SERVED: các cụm spine…). Ngân sách trên Sheet vẫn 165.000 (lúc chạy sếp chưa hạ xuống 85k). Cụm từ 30 ngày: "spine 2d" 13 hiển thị/3 click/243k + "spine 2d animation" 1 click/99k → ~340k/~510k chi vào người tìm phần mềm Spine, giờ đã EXCLUDED. Em tự thêm phủ định đợt 2 (5 lệnh): animatedsprite2d, godot, "sprite mancer", spritemancer, retrostyle.

## 2026-11-22 — Kiểm lại số liệu Ads/SEO (sếp: "số liệu không ổn lắm")
- Ads 12–21/11 (Sheet, cập nhật 22/11 15:44 UTC): 95 hiển thị / 13 click / 827.978đ / 0 chuyển đổi. 22/11 (GA4, chưa hết ngày): 55 hiển thị / 3 click / 4,63 USD (~120k). Tổng ~950k cho 16 click, 0 lead.
- 54% tiền (451k / 7 click) rơi vào "spine 2d" + "spine 2d animation" = người tìm PHẦN MỀM Spine; đã EXCLUDED từ 21/11 19:46 (giờ VN). Chỉ 2 từ khoá có click: "2d character animation for games" 10 click/613k (khớp rộng sang "spine 2d"), "spine animation studio" 3/215k. 30 ngày KHÔNG có cụm từ tìm nào là người đi thuê.
- Cụm rác mới (NONE): live2d cubism, bd2 l2d, rigby2d, sprite sheet maker, dragon bones 2d, flipaclip game, live2d azur lane, spine editor/price/professional… → em tự thêm phủ định đợt 3 (9 lệnh, `docs/marketing/2026-11-22-ads-negatives-3.json`, PENDING chờ lần chạy hằng giờ). Cố ý KHÔNG chặn price/rigging/professional (người thuê cũng dùng).
- Chất lượng click: 10 phiên Paid; 6 từ Thổ Nhĩ Kỳ (4 phiên 21/11, 2 phiên 22/11 — nghi cùng 1 người), Mỹ 1–7 giây, Đức 2 phiên. 0 generate_lead.
- Chiến dịch: ngân sách trên Sheet 100.000 (không phải 85k như kế hoạch), LEARNING (Tối đa lượt nhấp, trần CPC 100k); 21/11 mất IS do ngân sách 69%.
- Lead DB: 15–31/10 có 7 lead; 1–22/11 chỉ 2 (10/11 /contact, 20/11 /portfolio) → lead tự nhiên cũng giảm, không chỉ Ads. GA4: generate_lead 11 lần từ 1/10 nhưng keyEvents = 0 (chưa đánh dấu Sự kiện chính trong GA4); tag chuyển đổi Ads AW-18473620402/N9AB… có trong bundle prod (Ads tự đếm, không phụ thuộc GA4). Lead 20/11 không có generate_lead trong GA4 (chặn quảng cáo/consent?).
- GSC 14 ngày (8–21/11): 118 click / 3.619 hiển thị / vị trí 10,3; click gần như toàn thương hiệu; Mỹ 1.088 hiển thị vị trí 19, CTR 0,6%; "2d art outsourcing" 57 hiển thị vị trí ~16, 0 click.
- Commit các script marketing (marketing-report, ads-command, lib/google-sa, Ads Script v2) + docs lệnh từ 20/11 vốn chưa commit.
- Next: sếp quyết hướng Ads (đề xuất trong tin nhắn): tạm dừng / đổi sang giá thầu CPC thủ công + chỉ từ khoá có ý định thuê / giữ nguyên thêm 5–7 ngày sau phủ định. Đánh dấu generate_lead là Sự kiện chính trong GA4 (sếp bấm, 1 phút).
- (tiếp) Sếp chọn A: TẠM DỪNG chiến dịch `Search – Animation – T1` (22/11 ~22:50 giờ VN, sếp tự bấm trong giao diện). Sheet lúc đó vẫn ENABLED (lần chạy 15:44 UTC, trước khi dừng) → kiểm lại ở lần chạy hằng giờ sau. 9 lệnh phủ định đợt 3 vẫn PENDING, sẽ tự áp dụng khi script chạy (vô hại khi dừng). Bỏ kế hoạch "1/12 đặt lại 165k". Trước khi bật lại: trang /services/spine-animation + chỉ từ khoá có ý định thuê (exact) + cân nhắc CPC thủ công.
