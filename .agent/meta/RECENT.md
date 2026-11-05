# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-11-05 — Monster Legends: trạng thái tải Spine rõ ràng + báo lỗi/tải lại
- Task: sếp thấy lúc Spine đang tải khách dễ tưởng khung trống/lỗi (trước chỉ có nhãn nhỏ mờ "Summoning X…"; tải hỏng thì treo mãi).
- Work Done (`src/components/portfolio/spine-stage.tsx`, MonsterStage — áp mọi quái trên 10 trang hệ): nền tối + mờ (brightness .42 blur 3px) tới khi dựng xong; khung giữa có vòng xoay màu hệ + "Loading live animation…" + "<tên> · Spine 2D, rendered in real time in your browser"; nút animation disabled khi chưa sẵn sàng; quá 15s (LOAD_TIMEOUT_MS) hoặc onError → "Animation didn't load · Tap to retry" (đổi key `${base}#attempt` dựng lại player; quá hạn vẫn để player tải tiếp, xong muộn thì tự ẩn lỗi); tải xong hiện nhãn "● LIVE SPINE" góc trái.
- Lưu ý: spine-core AssetManager khi file tải hỏng (abort) ném "Unexpected end of JSON input" thay vì gọi callback error → trường hợp đó chỉ bắt được bằng mốc 15s.
- Result: dev local (Playwright route giả lập): chậm 8s/file → khung tải hiện rõ, nút mờ; chặn hẳn (context mới, không cache) → 15s ra Tap to retry; bỏ chặn + bấm retry → LIVE SPINE. tsc/eslint sạch file này.
- 2026-11-05 (fix sau deploy 2bee30a): prod mobile 390px khung "Loading" tràn sân khấu vuông (~240px) → màn < sm thu nhỏ vòng xoay/padding, dòng phụ rút gọn "Spine 2D · real time". Kiểm dev 390px OK.
  - Deploy ad47cb6 lần 1 FAIL cùng lỗi next/font Google trên VPS → rerun OK. Đã 3 lần (23/10, 05/11 ×2) → nên tự host font (next/font/local), chờ sếp OK.

## 2026-11-05 — Dọn việc treo: company-profile WIP, build tự thử lại, file meta
- Sếp "cho bạn tự quyết". (1) `company-profile/page.tsx` WIP không rõ nguồn (xoá Selected work + case study ORCA, thay media 4 thẻ service bằng minh hoạ CSS chưa gắn, lỗi tsc từ 03/11 → mọi push phải --no-verify): backup `.superpowers/wip/company-profile-2026-11-wip.patch` + `company-profile-page.wip.tsx`, `git restore` về bản prod. Chỉ sửa lưới Selected work: bỏ Axie/Summoner Era/Reaper/Animation Contest (founder ở công ty cũ) → 8 dự án studio (Monster Legends, Yomi 2, Epic Card, Horse Racing, Mytheria, Boss, Stickman, Kayn), chip = mảng công việc (khách phần lớn không nêu tên), ảnh = ảnh bìa DB. Giữ ORCA + media service như cũ (ORCA vẫn nền summonerDetail.png).
- `src/lib/project-covers.ts` (projectCovers(slugs)) dùng chung cho trang chủ + company-profile.
- `.github/workflows/deploy.yml`: `npm run build` lỗi → chờ 15s build lại 1 lần (lỗi next/font Google trên VPS lặp 3 lần) — thay vì tự host font (đụng nhiều file).
- Commit luôn 5 file meta tồn từ phiên trước (DECISIONS/SCHEMA mục ứng viên trùng 03/11 — SCHEMA sửa "CHƯA áp prod" → đã áp; AGENTS/CLAUDE số liệu GitNexus; RECENT).
- Result: tsc TOÀN dự án 0 lỗi (hết phải --no-verify); dev: /company-profile 8 ảnh bìa DB, trang chủ 8 ảnh bìa như cũ.
