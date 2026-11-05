# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-11-05 — /portfolio: dải video hero 6 dự án studio, chạy hết video mới chuyển
- Task: sếp hỏi dải thumbnail video ở hero /portfolio nên lấy video nào. Thực trạng: page_slots portfolio/hero-carousel TRỐNG → chạy fallback cứng; thẻ 4–5 dùng ảnh Summoner Era (CutScene_SE/4.png, 5.png) nhưng phát video Yomi 2 (lệch); timer 6s cắt video 12–25s giữa chừng.
- Khảo sát: ffprobe ~230 video CDN. Clip Behance 1–5s/nhỏ, Stickman/Chibi 640–960px, Monster Legends chỉ có Spine (không mp4) → loại. File landing/video/Super_Move/* khác On_Your_Knees/BIGBY trong media_assets đều 404 (bản đúng ở landing/portfolio/yomi-2/<slug>.mp4, 1920×834).
- Sếp chốt bộ 6 (đa dự án, mỗi thẻ một màu): Yomi 2 Gwen Desperation → Mytheria Zeus → Kayn Snow Moon (1080p loop 7s) → Yomi 2 Onimaru Clockwork Soldiers → Horse Racing → Epic Card Rocket Launcher. DB page_slots id 117–122 (sort 0–5) + fallback HERO_VIDEOS trong code cùng bộ.
- Code `src/app/portfolio/page.tsx`: bỏ setInterval 6s → onEnded của video đang hiện sang thẻ kế (quay vòng; đang hover dải thumbnail thì phát lại); thanh vàng dưới thumbnail chạy theo currentTime/duration thật (bỏ keyframes heroProgress).
- Result: dev local theo dõi 45s: Horse → Rocket → Gwen → Mytheria (đủ 16s) → Kayn, 6 thumbnail đúng ảnh. tsc sạch (trừ company-profile WIP); lint 1 lỗi "// 02" có sẵn.

## 2026-11-05 — Monster Legends: trạng thái tải Spine rõ ràng + báo lỗi/tải lại
- Task: sếp thấy lúc Spine đang tải khách dễ tưởng khung trống/lỗi (trước chỉ có nhãn nhỏ mờ "Summoning X…"; tải hỏng thì treo mãi).
- Work Done (`src/components/portfolio/spine-stage.tsx`, MonsterStage — áp mọi quái trên 10 trang hệ): nền tối + mờ (brightness .42 blur 3px) tới khi dựng xong; khung giữa có vòng xoay màu hệ + "Loading live animation…" + "<tên> · Spine 2D, rendered in real time in your browser"; nút animation disabled khi chưa sẵn sàng; quá 15s (LOAD_TIMEOUT_MS) hoặc onError → "Animation didn't load · Tap to retry" (đổi key `${base}#attempt` dựng lại player; quá hạn vẫn để player tải tiếp, xong muộn thì tự ẩn lỗi); tải xong hiện nhãn "● LIVE SPINE" góc trái.
- Lưu ý: spine-core AssetManager khi file tải hỏng (abort) ném "Unexpected end of JSON input" thay vì gọi callback error → trường hợp đó chỉ bắt được bằng mốc 15s.
- Result: dev local (Playwright route giả lập): chậm 8s/file → khung tải hiện rõ, nút mờ; chặn hẳn (context mới, không cache) → 15s ra Tap to retry; bỏ chặn + bấm retry → LIVE SPINE. tsc/eslint sạch file này.
- 2026-11-05 (fix sau deploy 2bee30a): prod mobile 390px khung "Loading" tràn sân khấu vuông (~240px) → màn < sm thu nhỏ vòng xoay/padding, dòng phụ rút gọn "Spine 2D · real time". Kiểm dev 390px OK.
  - Deploy ad47cb6 lần 1 FAIL cùng lỗi next/font Google trên VPS → rerun OK. Đã 3 lần (23/10, 05/11 ×2) → nên tự host font (next/font/local), chờ sếp OK.
