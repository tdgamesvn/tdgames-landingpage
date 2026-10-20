# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-10-20 — Khảo sát: AI mở link portfolio/LinkedIn để chấm được không (chưa code)
- Dữ liệu thật (95 hồ sơ): LinkedIn 34, Google Drive 34, Behance 32, còn lại linktr.ee, Canva, Wix, Framer, myportfolio, Figma, Netlify (lẻ tẻ).
- Fetch thường từ VPS: Behance 200, bóc được ~150 URL ảnh dự án (mir-s3-cdn-cf.behance.net). Site cá nhân (Netlify/Framer) 200, có ảnh. LinkedIn 999 — chặn bot, KHÔNG làm (vi phạm ToS). myportfolio có mật khẩu → không. Drive folder public: bóc được ID file từ HTML; thumbnail `drive.google.com/thumbnail?id=…&sz=w1200` ra ảnh với file ảnh (1/4), 404 với thư mục con/file khác → muốn chắc phải dùng Drive API key.
- Vision: gpt-5.6-sol (và gpt-6-sol) nhận image_url qua cliproxyapi, mô tả đúng ảnh Behance, ~4s/ảnh.
- Kết luận: làm được cho Behance + site cá nhân + Drive (một phần, đủ khi có API key). Chờ sếp quyết.

## 2026-10-20 — HR: AI xem SƠ BỘ portfolio khi chấm hồ sơ
- Task: sếp "trang portfolio có ảnh/video thì check sơ bộ thôi, đừng check hết — lâu + tốn token".
- Work Done: `src/lib/portfolio-preview.ts` — portfolio_url + website_url (≤2 link): tối đa **4 ảnh** tổng (Behance: 1 ảnh/project, khử trùng các cỡ; Drive folder public: thumbnail file ảnh; site cá nhân: og:image + <img> bỏ logo/icon), thu 768px JPEG q70, gửi vision `detail: low`; video chỉ đếm, không xem; chỉ lấy title/og:description. LinkedIn, trang Behance project (/gallery/ → 403 với máy chủ, 14/33 link Behance), trang có mật khẩu → ghi "chưa xem" + lý do, prompt cấm trừ điểm vì chưa xem được. Chỉ evaluate dùng (questions/analyze không). ai_evaluation thêm `portfolio_note` + `portfolio_links`; UI hiện dòng 🖼 + trạng thái từng link dưới AI Evaluation.
- Bảo mật (security review tự động bắt): `src/lib/safe-fetch.ts` — link do ứng viên nhập → chặn SSRF (chỉ http(s) cổng 80/443, chặn IP private/loopback/link-local/CGNAT 100.64/10 Tailscale/metadata, kiểm từng hop redirect), đọc stream có giới hạn byte; sharp limitInputPixels; regex Behance có chặn độ dài (ReDoS: chuỗi 3MB 1ms); prompt: nội dung portfolio là dữ liệu ứng viên kiểm soát, không phải chỉ dẫn. MBTI fetch cũng qua safeFetch. Còn hở DNS rebinding (không pin IP) — chấp nhận, kết quả chỉ vào prompt AI.
- Result: prod — Behance profile 4 ảnh khác nhau, 15s, nhận xét hợp lý (nhận ra dấu hiệu AI art); Drive + Framer 4 ảnh + đếm 12 video, 23s; link 169.254.169.254 bị chặn đúng. 3 ứng viên tạm (A/B/C) đã xoá qua API.
- Lưu ý: IP Mac bị Behance 429 (test local) — VPS thì 200.
- Update 2026-10-20 (security review lần 2): safeFetch viết lại bằng node:http(s) + `lookup` tự kiểm IP → IP được kiểm = IP được kết nối (hết DNS rebinding); `net.BlockList` thay so chuỗi (bản cũ hở `[::ffff:7f00:1]` dạng hex). Bẫy: KHÔNG thêm `::ffff:0:0/96` vào BlockList — nó khớp mọi IPv4 (BlockList tự map ::ffff:x sang luật IPv4). Đếm byte sau giải nén (bom gzip), cấm user:pass trong URL. `extractCvText` cũng qua safeFetch (cv_url lấy thẳng từ form công khai — lỗ SSRF có từ trước). Test 20 case: mọi dạng nội bộ (hex/mapped/NAT64/decimal/nip.io/redirect) bị chặn, site thật + gzip/br OK. Prod: CV thật đọc được, Behance 4 ảnh, link metadata dạng IPv6 bị chặn; ứng viên tạm đã xoá.
