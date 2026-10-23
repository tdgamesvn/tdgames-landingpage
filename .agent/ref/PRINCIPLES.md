# V4 — Nguyên tắc thiết kế (rút từ research)

Nguồn: Apple WWDC25 Liquid Glass (hierarchy · harmony · consistency), phân tích token apple.com (refero), Things 3 (MacStories), Linear UI redesign.

1. **Kiềm chế màu (~95% trung tính).** Cam `#FF9500` chỉ dùng cho hành động chính, trạng thái được chọn và con số tiền quan trọng. Không tô màu nền cho icon/tag hàng loạt.
2. **Chữ là xương sống.** Chỉ 2 độ đậm chính (400/600), display 700. Tiêu đề lớn có tracking âm (−0.03em ở 64–80px, −0.02em ở 28–40px), body 17px/1.47 ở trang công khai, 13–14px trong app. Inter có optical sizing (gần SF Pro nhất, đủ tiếng Việt).
3. **Khoảng trắng rộng rãi.** Hero ≥ 140px padding dọc, section 120px, card padding 32–40px. Tách bằng khoảng trắng trước, đường kẻ sau, bóng đổ cuối cùng.
4. **Chiều sâu bằng tông màu, không bằng bóng nặng.** Hairline 1px trong (inset), nền lớp kế tiếp sáng/tối hơn một nấc.
5. **Liquid Glass cho lớp điều khiển.** Thanh điều hướng, toolbar, tab bar, inspector là lớp kính nổi trên nội dung: blur + saturate, viền sáng mảnh phía trên (specular), dạng viên thuốc (capsule).
6. **Góc bo đồng tâm (concentric).** Góc trong = góc ngoài − padding (vd 28 → 16 khi padding 12).
7. **Cho người ta thấy sản phẩm.** Apple luôn đặt sản phẩm làm hình chính → trang công khai dùng chính giao diện app làm "ảnh hero" cho tới khi có tranh của studio.
8. **Ít mà tinh.** Bớt icon trang trí, bớt nhãn, mỗi màn chỉ một điểm nhấn.
