# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

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

## 2026-11-22 (tối) — Lead "giảm" + audit SEO nhanh; bắt đầu brainstorm /services/spine-animation
- Sếp: làm cả 2 (tìm nguyên nhân lead giảm + trang spine).
- Lead KHÔNG thực sự giảm: 7 lead 15–31/10 gồm 3 spam SEO (26, 27, 29/10) + 1 chào bán nền tảng AI (19/10) → khách thật 3 (17, 20, 25/10). Tháng 11 khách thật 2 (10/11 indie RPG, 20/11 studio igaming $5–20k). Nhịp khách thật ~1/tuần từ tháng 9, không đổi.
- Traffic tháng 11 TĂNG (1–22/11 vs 9–31/10): Organic Search 145→254 phiên, Direct 684→841, Referral 75→194; /contact 6→13 lượt xem. Singapore 243 phiên / 1 tương tác = bot (làm phồng số). GA4 generate_lead 7→1 (lead 20/11 không bắn sự kiện).
- Chat web: chỉ 4 luồng từ khi ra mắt, 0 tin kể từ 6/11. Mở thử widget prod (không gửi tin): hiện bình thường, 12 câu có sẵn → không hỏng, chỉ không ai dùng.
- SEO: click gần như toàn tên thương hiệu. /services/2d-animation có hiển thị cho "2d game animation services" (140, vị trí ~40), "2d game animation studio" (56, ~55) → trang 4–6 Google. Không có trang nào lên cho truy vấn "spine … outsourcing/studio". "2d art outsourcing" rơi vào các bài blog (vị trí 13–22), không vào /services/2d-art.
- Trang spine: recon — 28 case study có Spine (Monster Legends ×12, Axie Origins, Summoner Era…), /services/2d-animation dùng ServicePageTemplate + workflow/showcase/FAQ riêng; kế hoạch SEO đã chốt tách spine khỏi 2d-animation (2d-animation giữ frame-by-frame + link chéo). Đang hỏi sếp: khách thuê Spine cần thấy gì để chọn mình.
