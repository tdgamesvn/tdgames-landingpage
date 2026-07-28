# RECENT — 5 sessions gần nhất

_Auto-generated từ LOG.md. Không sửa tay._

---

## 2026-07-28 (session — email signature generator: HUỶ)
### Task
Sếp hỏi có làm được app tạo chữ ký email cho nhân viên không (tham chiếu HubSpot).

### Kết quả: HUỶ, đã xoá sạch code
Sếp quyết tạm gác. `src/app/signature/` đã xoá. Không commit, không deploy,
production chưa bao giờ có route này.

### Bài học (quan trọng hơn code)
- **Sếp hỏi "có làm được không?" — em code luôn. SAI.** Đó là câu hỏi khả thi,
  không phải lệnh. Em còn hỏi 3 câu, sếp chưa trả lời, em tự diễn giải thành
  "không chọn = default" rồi làm. Lần sau: hỏi xong thì ĐỢI.
- Scope thật lớn hơn em tưởng nhiều. Sếp gửi ảnh mẫu ở cuối: 2 cột, avatar tròn,
  logo, 4 icon social, 4 icon contact, tagline = **10 ảnh**, không phải 1 logo.

### Ghi chú kỹ thuật (nếu sau này làm lại)
- `border-radius` KHÔNG chạy trên Outlook desktop → avatar phải crop tròn sẵn thành PNG
- SVG không render trong Gmail/Outlook → icon phải PNG host trên CDN
- Chữ ký nhiều ảnh = lần đầu người nhận thấy toàn ô trống (client chặn ảnh mặc định)
- Bảng `team_members` đã có sẵn `name` / `title` / `photo` — đúng 3 field cần dùng
- Copy phải ghi clipboard dạng rich text (`ClipboardItem` với `text/html`),
  không phải chép chuỗi HTML thô

---

## 2026-07-28 (session — viết lại FAQ 3 service page)
### Task
BD gửi bộ FAQ mới cho 2D Art / 2D Animation / 2D VFX. Review và áp vào code.

### Work Done
- `service-faq-presets.ts`: 6 câu/service → 11 câu/service, viết lại toàn bộ
- Tách `sharedClosingFaqItems` (NDA + get started) dùng chung cả 3 — bản BD viết
  3 kiểu khác nhau cho cùng một ý. "What files" / "How much" giữ riêng (khác thật)
- Sửa claim SAI của BD: "GMT+7 overlap with US Pacific" — lệch 15h, gần như không
  overlap. Đổi thành "overnight turnaround for North America" (lợi thế thật)
- Thêm số thật vào câu "why TD Games" (70+/12+/1200+ lấy từ `home-page-lower.tsx`,
  VFX dùng 70+/40+/50+ từ `service-2d-vfx-featured-showcase.tsx`) — bản BD toàn tính từ
- Dùng đúng chữ "paid trial batch" khớp `home-page-lower.tsx:562`; BD viết lệch 3 kiểu
- VFX thiếu hẳn câu NDA → thêm
- Cắt mệnh đề tự tham chiếu thừa ("following the same review gates used for the rest
  of the pipeline") — tic lặp ở cả 3 bản BD

### Result
`npx tsc --noEmit` pass. Blast radius nhỏ: mỗi const 1 consumer (`service-2d-*-faq.tsx`).

### Blockers
- Sếp không cho số ngày cụ thể cho câu timeline → viết "delivery date committed with
  the quote" thay vì bịa số. Có số thật thì siết lại được.
- Sếp tưởng FAQ sửa được trong `/admin` — KHÔNG. Đang hardcode trong
  `service-faq-presets.ts`, không có tab/API nào đọc.

### Quyết định
- NDA wording: **giữ hero "on request", sửa FAQ**. Cam kết tuyệt đối kiểu "We sign an
  NDA before any brief changes hands" là sai thực tế (khách hỏi giá không ký giấy) và
  tạo ma sát đầu phễu. FAQ đổi sang "ask and we will have one signed the same day,
  from your template or ours" — giữ sức nặng, bỏ tính tuyệt đối, thêm 2 cam kết
  cụ thể (same-day, ký theo template khách).

### Next Step
- Chờ sếp chốt: có làm FAQ editable qua admin không (cần table + tab + API)

---

## 2026-07-27 (session — dọn repo)
### Task
Dọn artifact rác của playwright-mcp khỏi repo.

### Work Done
- Xoá `.playwright-mcp/` (10 file đã bị commit từ 2026-05 + 14 file untracked mới)
  và `portfolio-hero-test.png`
- `.gitignore`: thêm `.playwright-mcp/` và `*-test.png`

### Result
`git status` sạch, không còn artifact lảng vảng mỗi lần chạy playwright.

### Next Step
Không có task tồn đọng.

---

## 2026-07-27 (session — USP & CTA audit)
### Task
Rà soát USP + CTA toàn site, đề xuất và áp dụng nhóm ưu tiên 1–2.

### Work Done
- Audit: hero → services → why-us → careers → contact → header/footer
- **P1** `home-services-section.tsx`: paragraph dưới "OUR SERVICES" là ghi chú
  thiết kế nội bộ đang chạy production → thay bằng copy thật (Spine / frame-by-frame /
  Unity-ready)
- **P2** `home-hero.tsx`: bỏ định vị "3D" (studio là 2D-only, không có trang 3D nào)
  → title "2D ART & ANIMATION / OUTSOURCING STUDIO"; desc bỏ "specifically for mobile
  games" → "mobile, PC and web titles"
- **P2** Hero CTA: "Get in touch" → "Get a Free Quote" + thêm secondary "View Our Work"
  → /portfolio + micro-copy "Reply within 24h · NDA on request"
- `site-header.tsx`: đồng bộ 5 nhãn "Get a Quote" → "Get a Free Quote"
- `npx tsc --noEmit` clean

### Result
Định vị nhất quán 2D, hết text nội bộ lộ ra ngoài, CTA có 1 nhãn primary chuẩn +
đường thoát low-commitment cho lead chưa sẵn sàng.

### P3 (làm tiếp cùng session)
- `home-page-lower.tsx` WHY CHOOSE: 2 item generic → differentiator thật
  - "REASONABLE PRICES" → **PAID TRIAL BATCH** (căn cứ: blog site.json:184,197)
  - "STREAMLINED WORKFLOW" → **ENGINE-READY DELIVERY** (căn cứ: services/2d-vfx
    "Unity & Spine Integration", services/2d-animation "Spine Animation")
- Careers band: bỏ nút "Contact us" cạnh "View vacancies" (lẫn audience)
- LET'S TALK: bỏ nút "Contact" trùng (2 nút cùng trỏ /contact) + "Get a quote"
  → "Get a Free Quote"
- `site-footer.tsx`: bỏ "Developer" / "Game Design" (lệch định vị 2D art),
  giữ "Game UI" → /contact (có comment `ponytail:` giải thích)
- `npx tsc --noEmit` clean

### Số liệu — sếp chốt "ít thôi, đúng tầm công ty mới"
- `site.json` service cards: 50+/50+/50+ → **Animation 30+ · Art 25+ · VFX 15+** (tổng 70)
- Stats band `home-page-lower.tsx`: 150+ → **70+** PROJECTS · 50+ → **12+** CLIENTS ·
  3700+ → **1200+** ASSETS (khớp tổng service cards; 16 case study trên portfolio
  = phần hiển thị của 70)
- Bonus: `CountUp` đang là if-chain hardcode `=== "150+"` → `parseInt(stat.value, 10)`,
  đổi số không còn phải sửa 2 chỗ
- Giữ nguyên `service-2d-art-featured-showcase.tsx` (45+ environments, 200+ assets —
  nằm gọn trong 1200+)
- `npx tsc --noEmit` clean

### Deploy
- Commit `67dc61f` → push main (pre-push typecheck pass)
- VPS: `git pull` → `npm run build` → `pm2 restart tdgames-landingpage` (restart #87, online)
- Verify prod: `curl -sL https://www.tdgamestudio.com` → "Get a Free Quote" ×2,
  "View Our Work" ×1, "2D ART &amp; ANIMATION" ✅
  (WHY CHOOSE / stats không có trong HTML đầu — section dưới không SSR, verify bằng mắt)
- Lưu ý: build local phải `dangerouslyDisableSandbox` vì next/font fetch Google Fonts

### P4 hoá ra là TASK MA — `site.json → blog.posts` là dead data
- Định làm "viết lại 6/12 bài blog về 3D", đã viết xong 5 bài mới vào `site.json`…
  rồi mới phát hiện `blog.posts` **không được render ở đâu cả**.
- Blog thật đọc từ Supabase `blog_posts` qua `GET /api/blog` (`src/app/blog/page.tsx`
  fetch client-side). Production đang có **8 bài, tất cả đúng định vị 2D**
  (`why-2d-animation-still-rules-game-art`, `from-sketch-to-sprite-our-2d-art-pipeline`,
  `frame-by-frame-principles-of-game-animation`, `vfx-on-a-budget…`, …) — không bài 3D nào.
- → Revert 5 bài vừa viết, **xoá hẳn key `blog` khỏi `site.json`** (184 dòng dead data)
  + xoá `BlogPost` khỏi `src/types/site-content.ts`. Chính nó là thứ khiến audit tin
  nhầm là blog còn placeholder/3D.
- **Sitemap**: phát hiện blog detail pages chưa từng có trong sitemap → thêm, đọc
  `blog_posts` từ Supabase (try/catch, DB lỗi thì bỏ blog routes chứ không fail cả
  sitemap). `sitemap()` chuyển thành async. Build ra 34 URL (10 static + 16 portfolio
  + 8 blog).
- Sửa `CLAUDE.md`: dòng "site.json là nguồn `blog.posts[]`" đã sai từ lâu → ghi rõ
  blog nằm ở Supabase.

### Deploy đợt 2
- Commit `0a8bf76` → push → VPS pull + build + `pm2 restart` (restart #89)
- Verify: `curl https://tdgamestudio.com/sitemap.xml` → 34 `<url>`, có đủ 8 blog route ✅
- Canonical domain là **non-www** (`www.` 301 → `tdgamestudio.com`). Docs đang ghi
  `https://www.tdgamestudio.com` → sửa lại non-www ở CLAUDE.md ×2 + PROJECT.md
  (curl vào www trả 301 làm verify hụt 2 lần trong session này)

### Task ma thứ 2 — CLAUDE.md "Current Task Priority" stale nặng
Sếp hỏi "tưởng xong hết rồi mà" → verify bằng curl/ls thay vì đọc doc:
- `/api/jobs` trả job thật, `/careers` 200, `/hr` 200 → **Careers xong lâu rồi**
  (migration `20260524120000_careers_schema.sql`), doc vẫn ghi `jobs`/`applications`
  "(sắp tạo)"
- Admin thực tế **13 tab** (Blog, Careers, Footer, PageSlots, Settings, Spine, Team…),
  doc ghi 6
- `/api/hr/*` (applications, jobs, remind, upload) + HR dashboard — doc không nhắc
- Env `AI_BASE_URL/AI_API_KEY/AI_MODEL` đã có trên VPS → task "set env AI_*" cũng xong
→ Viết lại CLAUDE.md: admin tabs, bảng DB (thêm blog_posts/jobs/applications/page_slots),
  mục HR Dashboard, và thay "Current Task Priority" bằng cảnh báo verify-trước-khi-tin.

### Bài học (cập nhật)
- **Hai task ma trong một session** đều do doc stale. Quy tắc mới: trước khi bắt tay
  vào "task còn lại" trong CLAUDE.md/TASKS.md, verify bằng `curl` production hoặc
  `ls` source. Doc là gợi ý, không phải sự thật.

### Bài học (cũ)
- CLAUDE.md stale dẫn tới cả một task ma. Trước khi "sửa nội dung", verify xem
  file đó có thực sự được render không (`grep` chỗ dùng, hoặc curl API production).

---

## 2026-07-09 (session — HR AI Evaluation)
### Task
Feature 2: AI evaluation ứng viên qua cliproxyapi (OpenAI-compatible, port 8317 trên Mac).

### Work Done
- Migration `add_ai_evaluation_to_applications`: `ai_score` int + `ai_evaluation` jsonb
- Route mới `POST /api/hr/applications/[id]/evaluate`: requireHR → fetch app + JD →
  gọi `${AI_BASE_URL}/chat/completions` (env: AI_BASE_URL/AI_API_KEY/AI_MODEL,
  default gpt-5.4-mini) → parse JSON `{score, verdict, strengths, concerns}` → lưu DB
- `types.ts`: type `AiEvaluation` + 2 field trên `Application`
- `HRDashboard.tsx`: badge `🤖 {score}` trên AppCard (xanh ≥75 / vàng ≥50 / đỏ);
  panel AI Evaluation trong CandidateModal (nút Evaluate/Re-evaluate, verdict,
  strengths/concerns); prop `onPatch` để sync state
- `.env.local`: thêm AI_BASE_URL=http://localhost:8317/v1, AI_API_KEY, AI_MODEL

### Result
- `tsc --noEmit` pass ✅
- Test end-to-end pass ✅: POST evaluate trên ứng viên thật → score 78, verdict "yes",
  strengths/concerns tiếng Việt hợp lý, lưu DB đúng (~vài giây với gpt-5.4-mini)

### Nâng cấp: đọc CV PDF
- `extractCvText()` trong evaluate route: fetch CV từ CDN → extract text bằng `unpdf`
  (dep mới, serverless-friendly) → nhét `cv_text` (cap 12k chars) vào prompt.
  PDF only; fail thì fallback chấm theo form data. Thêm `today` vào prompt
  (trước đó AI phán sai "ngày available khá xa"). Verified: score 72→82 sau khi đọc CV thật.

### Hardening CV pipeline
- Guard content-length > 20MB → skip tải CV
- CV không đọc được (thuần ảnh / quá nặng / không phải PDF) → tự động chèn concern
  "⚠️ Không đọc được nội dung CV..." vào đầu list để HR biết điểm chỉ dựa trên form data

### Bugfix kèm theo
- Không chuyển được status "test": enum `application_status` trong DB thiếu giá trị
  (UI/types có từ session trước nhưng chưa migrate). Migration
  `add_test_to_application_status`: `alter type ... add value 'test' before 'interview'`.
  Verified: PATCH status=test → 200 ✅

### Deploy production
- Đã thêm AI_BASE_URL/AI_API_KEY/AI_MODEL vào `/opt/tdgames-landingpage/.env.local`
  trên VPS + pm2 restart. VPS reach cliproxyapi trên Mac qua Tailscale OK (200).
  Verified evaluate trên https://www.tdgamestudio.com → 200 ✅
- Lưu ý vận hành: Mac tắt/ngủ → nút Evaluate trên prod báo lỗi 502, HR bấm lại sau

---

